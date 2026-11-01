using Microsoft.EntityFrameworkCore;

namespace SixStack.Cli.Tests;

/// <summary>Acceptance tests for keeping secrets and contact details out of CLI output (L2-113).</summary>
public sealed class EventsPrivacyTests
{
    private const string Secret = "Sup3r-Secret-Pa55";

    // L2-113 #1: Given an event with a submitter email, then list, get and get --json never show it;
    // get --show-contact does.
    [Fact]
    public async Task Submitter_email_appears_only_when_asked_for()
    {
        using var cli = await CliHarness.SeededAsync();

        var outputs = new[]
        {
            await cli.RunAsync("events", "list", "--take", "500"),
            await cli.RunAsync("events", "list", "--take", "500", "--json"),
            await cli.RunAsync("events", "get", "azure-data-ai-day-gta"),
            await cli.RunAsync("events", "get", "azure-data-ai-day-gta", "--json"),
        };
        var shown = await cli.RunAsync("events", "get", "azure-data-ai-day-gta", "--show-contact", "--json");

        Assert.All(outputs, o =>
        {
            Assert.Equal(0, o.ExitCode);
            Assert.DoesNotContain(CliHarness.Organizer, o.Output);
            Assert.DoesNotContain("submitterEmail", o.Output);
        });
        Assert.Equal(CliHarness.Organizer, shown.Json.GetProperty("event").GetProperty("submitterEmail").GetString());
    }

    // L2-113 #2: Given a database that cannot be opened with a connection string holding a password, then exit code
    // 10 and neither the connection string nor the password appears.
    [Theory]
    [InlineData("list")]
    [InlineData("get")]
    public async Task Unexpected_failure_prints_no_connection_details(string command)
    {
        var connection = $"Data Source={Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"), "missing", "x.db")};Mode=ReadOnly;Password={Secret}";
        using var cli = new CliHarness(database: o => o.UseSqlite(connection));
        string[] args = command == "get" ? ["events", "get", "some-event"] : ["events", "list"];

        var text = await cli.RunAsync(args);
        var json = await cli.RunAsync([.. args, "--json"]);

        Assert.Equal(10, text.ExitCode);
        Assert.StartsWith("Unexpected error (", text.Output);
        Assert.Contains("Details are not printed, to keep secrets out of the output.", text.Output);
        Assert.Equal("unexpected", json.Json.GetProperty("error").GetProperty("code").GetString());
        foreach (var output in new[] { text.Output, json.Output })
        {
            Assert.DoesNotContain(Secret, output);
            Assert.DoesNotContain("Data Source", output, StringComparison.OrdinalIgnoreCase);
        }
    }
}
