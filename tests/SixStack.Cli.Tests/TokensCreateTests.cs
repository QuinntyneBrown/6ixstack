using Microsoft.EntityFrameworkCore;

namespace SixStack.Cli.Tests;

/// <summary>Acceptance tests for <c>tokens create</c> (L2-120, L2-122, L2-124).</summary>
public sealed class TokensCreateTests : IAsyncLifetime
{
    private CliHarness cli = null!;

    public async Task InitializeAsync() => cli = await CliHarness.SeededAsync();

    public Task DisposeAsync()
    {
        cli.Dispose();
        return Task.CompletedTask;
    }

    // L2-124 #1, L2-120 #1: Given a moderator actor, --name laptop-agent and --yes, when tokens create runs, then
    // exit 0, the token is printed once with its id, name and expiry, and only its salt and hash are stored.
    [Fact]
    public async Task Create_prints_the_token_once_and_stores_only_its_hash()
    {
        var result = await cli.RunAsync("tokens", "create", "--name", "laptop-agent", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(0, result.ExitCode);
        var token = Assert.Single(result.Output.Split(['\n', ' '], StringSplitOptions.TrimEntries), w => w.StartsWith("sxk_", StringComparison.Ordinal));
        Assert.Contains("laptop-agent", result.Output);
        Assert.Contains("2027-01-31", result.Output);
        Assert.Contains("Store this token now; it can't be shown again.", result.Output);
        var row = await cli.QueryAsync(db => db.ApiTokens.Include(t => t.User).SingleAsync());
        Assert.Contains(row.Id.ToString(), result.Output);
        Assert.Equal(CliHarness.Moderator, row.User!.Email);
        Assert.Equal("laptop-agent", row.Name);
        Assert.Equal(DateTimeOffset.Parse("2027-01-31T14:00:00Z"), row.ExpiresAtUtc);
        Assert.Null(row.RevokedAtUtc);
        Assert.NotEmpty(row.Salt);
        Assert.Equal(64, row.TokenHash.Length);
        var secret = token[("sxk_".Length + 32 + 1)..];
        Assert.DoesNotContain(secret, row.TokenHash + row.Salt, StringComparison.OrdinalIgnoreCase);
        Assert.True(secret.Length >= 43, "at least 256 bits of randomness");
    }

    // L2-124 #1, L2-110: Given --json and --days 30, when tokens create runs, then one JSON result holds the token
    // and the token record with its expiry.
    [Fact]
    public async Task Create_with_json_prints_one_result_document()
    {
        var result = await cli.RunAsync("tokens", "create", "--name", "ci", "--days", "30", "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(0, result.ExitCode);
        var r = result.Json.GetProperty("result");
        Assert.Equal("created", r.GetProperty("action").GetString());
        Assert.False(r.GetProperty("dryRun").GetBoolean());
        Assert.StartsWith("sxk_", r.GetProperty("token").GetString());
        var apiToken = r.GetProperty("apiToken");
        Assert.Equal("ci", apiToken.GetProperty("name").GetString());
        Assert.Equal("active", apiToken.GetProperty("status").GetString());
        Assert.Equal(DateTimeOffset.Parse("2026-12-02T14:00:00Z"), apiToken.GetProperty("expiresAtUtc").GetDateTimeOffset());
    }

    // L2-124 #2: Given --dry-run, or no --yes with redirected input, when tokens create runs, then nothing is stored.
    [Theory]
    [InlineData("--dry-run", 0)]
    [InlineData("--json", 6)]
    public async Task Create_without_yes_stores_nothing(string flag, int exitCode)
    {
        var result = await cli.RunAsync("tokens", "create", "--name", "laptop-agent", "--actor", CliHarness.Moderator, flag);

        Assert.Equal(exitCode, result.ExitCode);
        Assert.DoesNotContain("sxk_", result.Output);
        Assert.Equal(0, await cli.QueryAsync(db => db.ApiTokens.CountAsync()));
    }

    // L2-124 #2, L2-111 #5: Given an interactive run answered "y", when tokens create runs, then the token is created.
    [Fact]
    public async Task Create_asks_before_storing_when_interactive()
    {
        var result = await cli.RunWithInputAsync("y\n", "tokens", "create", "--name", "laptop-agent", "--actor", CliHarness.Moderator);

        Assert.Equal(0, result.ExitCode);
        Assert.Contains("Apply? [y/N]", result.Output);
        Assert.Equal(1, await cli.QueryAsync(db => db.ApiTokens.CountAsync()));
    }

    // L2-124 #3, L2-120 #5: Given no actor, or an organizer actor, when tokens create runs, then exit 5 and nothing is stored.
    [Theory]
    [InlineData(null)]
    [InlineData(CliHarness.Organizer)]
    [InlineData("nobody@example.com")]
    public async Task Create_needs_a_moderator_actor(string? actor)
    {
        string[] args = actor is null
            ? ["tokens", "create", "--name", "x", "--yes"]
            : ["tokens", "create", "--name", "x", "--actor", actor, "--yes"];

        var result = await cli.RunAsync(args);

        Assert.Equal(5, result.ExitCode);
        Assert.Equal(0, await cli.QueryAsync(db => db.ApiTokens.CountAsync()));
    }

    // L2-124 #6: Given a missing or too long name, or days outside 1 to 365, when tokens create runs, then exit 2;
    // given days that are not a number, then exit 1; nothing is stored.
    [Theory]
    [InlineData(2, "--days", "30")]
    [InlineData(2, "--name", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]
    [InlineData(2, "--name", "x", "--days", "0")]
    [InlineData(2, "--name", "x", "--days", "366")]
    [InlineData(1, "--name", "x", "--days", "soon")]
    public async Task Create_refuses_bad_values(int exitCode, params string[] options)
    {
        var result = await cli.RunAsync(["tokens", "create", .. options, "--actor", CliHarness.Moderator, "--yes"]);

        Assert.Equal(exitCode, result.ExitCode);
        Assert.Equal(0, await cli.QueryAsync(db => db.ApiTokens.CountAsync()));
    }

    // L2-122 #3: Given a token created from the CLI, when the audit trail is read, then ApiTokenCreated names the
    // moderator and the token, ends with "via CLI", and does not hold the token.
    [Fact]
    public async Task Create_is_audited_without_the_token()
    {
        var result = await cli.RunAsync("tokens", "create", "--name", "laptop-agent", "--actor", CliHarness.Moderator, "--yes", "--json");

        var token = result.Json.GetProperty("result").GetProperty("token").GetString()!;
        var row = await cli.QueryAsync(db => db.ApiTokens.SingleAsync());
        var entry = Assert.Single(await cli.QueryAsync(db => db.AuditEntries.Where(a => a.TargetId == row.Id).ToListAsync()));
        Assert.Equal("ApiTokenCreated", entry.Action);
        Assert.Equal("ApiToken", entry.TargetType);
        Assert.Equal(row.UserId, entry.ActorId);
        Assert.Equal("laptop-agent; via CLI", entry.Details);
        Assert.DoesNotContain(token[^20..], entry.Details);
    }
}
