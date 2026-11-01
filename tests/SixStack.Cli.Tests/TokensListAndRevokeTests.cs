using Microsoft.EntityFrameworkCore;

namespace SixStack.Cli.Tests;

/// <summary>Acceptance tests for <c>tokens list</c> and <c>tokens revoke</c> (L2-120, L2-122, L2-124).</summary>
public sealed class TokensListAndRevokeTests : IAsyncLifetime
{
    private const string SecondModerator = "sam@6ixstack.dev";

    private CliHarness cli = null!;
    private string token = null!;
    private Guid tokenId;

    public async Task InitializeAsync()
    {
        cli = await CliHarness.SeededAsync();
        var created = await cli.RunAsync("tokens", "create", "--name", "laptop-agent", "--actor", CliHarness.Moderator, "--yes", "--json");
        token = created.Json.GetProperty("result").GetProperty("token").GetString()!;
        tokenId = created.Json.GetProperty("result").GetProperty("apiToken").GetProperty("id").GetGuid();
        Assert.Equal(0, (await cli.RunAsync("tokens", "create", "--name", "sams-agent", "--actor", SecondModerator, "--yes")).ExitCode);
    }

    public Task DisposeAsync()
    {
        cli.Dispose();
        return Task.CompletedTask;
    }

    // L2-124 #4, L2-120 #2: Given tokens list --json, then it lists only the actor's tokens with their dates and
    // status, and holds no token, salt or hash.
    [Fact]
    public async Task List_shows_the_actors_tokens_without_secrets()
    {
        var result = await cli.RunAsync("tokens", "list", "--actor", CliHarness.Moderator, "--json");

        Assert.Equal(0, result.ExitCode);
        Assert.Equal(1, result.Json.GetProperty("count").GetInt32());
        var t = Assert.Single(result.Json.GetProperty("tokens").EnumerateArray());
        Assert.Equal(tokenId, t.GetProperty("id").GetGuid());
        Assert.Equal("laptop-agent", t.GetProperty("name").GetString());
        Assert.Equal("active", t.GetProperty("status").GetString());
        Assert.Equal(DateTimeOffset.Parse("2026-11-02T14:00:00Z"), t.GetProperty("createdAtUtc").GetDateTimeOffset());
        Assert.Equal(DateTimeOffset.Parse("2027-01-31T14:00:00Z"), t.GetProperty("expiresAtUtc").GetDateTimeOffset());
        Assert.Equal(System.Text.Json.JsonValueKind.Null, t.GetProperty("lastUsedAtUtc").ValueKind);
        Assert.Equal(System.Text.Json.JsonValueKind.Null, t.GetProperty("revokedAtUtc").ValueKind);
        var row = await cli.QueryAsync(db => db.ApiTokens.SingleAsync(x => x.Id == tokenId));
        Assert.DoesNotContain(token[^20..], result.Output);
        Assert.DoesNotContain(row.TokenHash, result.Output);
        Assert.DoesNotContain(row.Salt, result.Output);
        Assert.DoesNotContain("sams-agent", result.Output);
    }

    // L2-120 #2: Given an expired token, when the list is shown as a table, then its status is expired.
    [Fact]
    public async Task List_table_shows_each_tokens_status()
    {
        await cli.QueryAsync(async db =>
        {
            var row = await db.ApiTokens.SingleAsync(x => x.Id == tokenId);
            row.ExpiresAtUtc = DateTimeOffset.Parse("2026-11-01T00:00:00Z");
            return await db.SaveChangesAsync();
        });

        var result = await cli.RunAsync("tokens", "list", "--actor", CliHarness.Moderator);

        Assert.Equal(0, result.ExitCode);
        Assert.Contains("ID", result.Output);
        Assert.Contains("NAME", result.Output);
        Assert.Contains("STATUS", result.Output);
        Assert.Contains(tokenId.ToString(), result.Output);
        Assert.Contains("expired", result.Output);
        Assert.Contains("1 token(s).", result.Output);
    }

    // L2-124 #3: Given no actor, when tokens list runs, then exit 5.
    [Fact]
    public async Task List_needs_a_moderator_actor()
    {
        Assert.Equal(5, (await cli.RunAsync("tokens", "list")).ExitCode);
        Assert.Equal(5, (await cli.RunAsync("tokens", "list", "--actor", CliHarness.Organizer)).ExitCode);
    }

    // L2-124 #5, L2-122 #3: Given one of the actor's tokens and --yes, when tokens revoke runs, then exit 0, the
    // token is revoked and ApiTokenRevoked names the moderator and the token, via CLI.
    [Fact]
    public async Task Revoke_revokes_the_token_and_audits_it()
    {
        var result = await cli.RunAsync("tokens", "revoke", tokenId.ToString(), "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(0, result.ExitCode);
        Assert.Contains($"Revoked token laptop-agent ({tokenId})", result.Output);
        var row = await cli.QueryAsync(db => db.ApiTokens.SingleAsync(x => x.Id == tokenId));
        Assert.Equal(DateTimeOffset.Parse("2026-11-02T14:00:00Z"), row.RevokedAtUtc);
        var entry = await cli.QueryAsync(db => db.AuditEntries.Where(a => a.TargetId == tokenId).ToListAsync());
        var revoked = Assert.Single(entry, e => e.Action == "ApiTokenRevoked");
        Assert.Equal(row.UserId, revoked.ActorId);
        Assert.Equal("laptop-agent; via CLI", revoked.Details);
        var list = await cli.RunAsync("tokens", "list", "--actor", CliHarness.Moderator, "--json");
        Assert.Equal("revoked", list.Json.GetProperty("tokens")[0].GetProperty("status").GetString());
    }

    // L2-124 #2: Given --dry-run, when tokens revoke runs, then exit 0 and nothing changes.
    [Fact]
    public async Task Revoke_dry_run_changes_nothing()
    {
        var result = await cli.RunAsync("tokens", "revoke", tokenId.ToString(), "--actor", CliHarness.Moderator, "--dry-run");

        Assert.Equal(0, result.ExitCode);
        Assert.Contains($"Will revoke token laptop-agent ({tokenId})", result.Output);
        Assert.Null(await cli.QueryAsync(db => db.ApiTokens.Where(x => x.Id == tokenId).Select(x => x.RevokedAtUtc).SingleAsync()));
    }

    // L2-124 #5: Given another moderator's token or an unknown id, then exit 3; an id that is not a Guid is exit 1.
    [Fact]
    public async Task Revoke_reaches_only_the_actors_own_tokens()
    {
        Assert.Equal(3, (await cli.RunAsync("tokens", "revoke", tokenId.ToString(), "--actor", SecondModerator, "--yes")).ExitCode);
        Assert.Equal(3, (await cli.RunAsync("tokens", "revoke", Guid.NewGuid().ToString(), "--actor", CliHarness.Moderator, "--yes")).ExitCode);
        Assert.Equal(1, (await cli.RunAsync("tokens", "revoke", "laptop-agent", "--actor", CliHarness.Moderator, "--yes")).ExitCode);
        Assert.Null(await cli.QueryAsync(db => db.ApiTokens.Where(x => x.Id == tokenId).Select(x => x.RevokedAtUtc).SingleAsync()));
    }

    // L2-110: Given a revoked token, when it is revoked again, then exit 4.
    [Fact]
    public async Task Revoking_twice_is_a_conflict()
    {
        await cli.RunAsync("tokens", "revoke", tokenId.ToString(), "--actor", CliHarness.Moderator, "--yes");

        var result = await cli.RunAsync("tokens", "revoke", tokenId.ToString(), "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(4, result.ExitCode);
        Assert.Equal("conflict", result.Json.GetProperty("error").GetProperty("code").GetString());
    }
}
