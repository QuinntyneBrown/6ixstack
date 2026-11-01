using Microsoft.EntityFrameworkCore;
using SixStack.Domain.Enums;

namespace SixStack.Cli.Tests;

/// <summary>Acceptance tests for <c>events add</c> and the write rails it brings (L2-107, L2-110, L2-111, L2-112).</summary>
public sealed class EventsAddTests : IAsyncLifetime
{
    private const string ValidEvent = """
        {
          "title": "Kotlin Multiplatform Night",
          "organizerName": "Toronto Mobile Devs",
          "description": "Sharing code between Android and iOS, with two short talks.",
          "topics": ["ai"],
          "date": "2026-12-03",
          "startTime": "18:30",
          "endTime": "20:30",
          "format": "inPerson",
          "venueName": "MaRS Discovery District",
          "streetAddress": "101 College St",
          "city": "Toronto",
          "isFree": true
        }
        """;

    private CliHarness cli = null!;
    private string file = null!;

    public async Task InitializeAsync()
    {
        cli = await CliHarness.SeededAsync();
        file = Path.GetTempFileName();
        await File.WriteAllTextAsync(file, ValidEvent);
    }

    public Task DisposeAsync()
    {
        cli.Dispose();
        File.Delete(file);
        return Task.CompletedTask;
    }

    // L2-107 #1, L2-112 #1: Given a valid file, a moderator actor and --yes, when add runs, then the event is stored
    // published with a slug from its title, and one EventAdded audit entry names the actor and "via CLI".
    [Fact]
    public async Task Add_publishes_the_event_and_audits_it()
    {
        var result = await cli.RunAsync("events", "add", "--file", file, "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(0, result.ExitCode);
        Assert.Contains("kotlin-multiplatform-night", result.Output);
        var e = await cli.QueryAsync(db => db.Events.SingleAsync(x => x.Slug == "kotlin-multiplatform-night"));
        Assert.Contains(e.Id.ToString(), result.Output);
        Assert.Equal(EventStatus.Published, e.Status);
        Assert.NotNull(e.PublishedAtUtc);
        Assert.Null(e.SubmitterEmail);
        Assert.Equal("Toronto Mobile Devs", e.OrganizerName);
        Assert.Equal(DateTimeOffset.Parse("2026-12-03T23:30:00Z"), e.StartsAtUtc);
        var moderatorId = await cli.QueryAsync(db => db.Users.Where(u => u.Email == CliHarness.Moderator).Select(u => u.Id).SingleAsync());
        var audit = await cli.QueryAsync(db => db.AuditEntries.Where(a => a.TargetId == e.Id).ToListAsync());
        var entry = Assert.Single(audit);
        Assert.Equal("EventAdded", entry.Action);
        Assert.Equal(moderatorId, entry.ActorId);
        Assert.EndsWith("via CLI", entry.Details);
    }

    // L2-107: flags win over the file, and an event can be added from flags alone.
    [Fact]
    public async Task Add_takes_flags_over_the_file()
    {
        var result = await cli.RunAsync("events", "add", "--file", file, "--title", "KMP Night", "--price", "25", "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(0, result.ExitCode);
        var e = await cli.QueryAsync(db => db.Events.SingleAsync(x => x.Slug == "kmp-night"));
        Assert.Equal(2500, e.PriceCents);
    }

    [Fact]
    public async Task Add_works_from_flags_alone()
    {
        var result = await cli.RunAsync(
            "events", "add", "--title", "Remote Rust Hour", "--organizer", "Rustaceans TO", "--description", "An hour of Rust Q&A.",
            "--topics", "ai,dotnet", "--date", "2026-12-10", "--start", "12:00", "--end", "13:00", "--format", "streaming",
            "--stream-url", "https://example.org/live", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(0, result.ExitCode);
        var e = await cli.QueryAsync(db => db.Events.SingleAsync(x => x.Slug == "remote-rust-hour"));
        Assert.Equal(EventFormat.Streaming, e.Format);
        Assert.Equal(Topics.AI | Topics.DotNet, e.Topics);
        Assert.Equal("https://example.org/live", e.StreamUrl);
    }

    // L2-107 #2, L2-112 #2: Given no title and an http ticket link, then exit code 2 lists the errors field by field,
    // and nothing is stored or audited.
    [Fact]
    public async Task Add_reports_validation_errors_field_by_field()
    {
        await File.WriteAllTextAsync(file, ValidEvent.Replace("\"Kotlin Multiplatform Night\"", "\"\"").Replace("\"isFree\": true", "\"isFree\": true, \"ticketUrl\": \"http://tickets.example.org\""));
        var before = await EventCount();

        var result = await cli.RunAsync("events", "add", "--file", file, "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(2, result.ExitCode);
        Assert.Contains("title: Enter a title for the event.", result.Output);
        Assert.Contains("ticketUrl: Enter a full link that starts with https://", result.Output);
        Assert.Equal(before, await EventCount());
        Assert.Equal(0, await AuditCount());
    }

    // L2-110 #4: the same failure as JSON maps each field to its messages.
    [Fact]
    public async Task Add_validation_errors_as_json()
    {
        var result = await cli.RunAsync("events", "add", "--file", file, "--title", "", "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(2, result.ExitCode);
        var error = result.Json.GetProperty("error");
        Assert.Equal("validation", error.GetProperty("code").GetString());
        Assert.Equal("Enter a title for the event.", error.GetProperty("fields").GetProperty("title")[0].GetString());
    }

    // L2-107 #3: Given an unknown field, a file that is not JSON, or a missing file, then exit code 1.
    [Theory]
    [InlineData("{ \"title\": \"X\", \"colour\": \"red\" }")]
    [InlineData("title: X")]
    [InlineData(null)]
    public async Task Add_rejects_a_bad_file_as_a_usage_error(string? content)
    {
        var path = content is null ? Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".json") : file;
        if (content is not null)
        {
            await File.WriteAllTextAsync(file, content);
        }

        var before = await EventCount();

        var result = await cli.RunAsync("events", "add", "--file", path, "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(1, result.ExitCode);
        Assert.Contains("--file", result.Output);
        Assert.Equal(before, await EventCount());
    }

    // L2-107 #4: Given a title whose slug is taken, then the slug gets the next free suffix.
    [Fact]
    public async Task Add_gives_a_taken_slug_the_next_suffix()
    {
        var result = await cli.RunAsync("events", "add", "--file", file, "--title", "Signals all the way down", "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(0, result.ExitCode);
        Assert.Equal("signals-all-the-way-down-2", result.Json.GetProperty("result").GetProperty("event").GetProperty("slug").GetString());
    }

    // L2-110 #3: a successful write as JSON is one result document.
    [Fact]
    public async Task Add_result_as_json_has_a_stable_shape()
    {
        var result = await cli.RunAsync("events", "add", "--file", file, "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(0, result.ExitCode);
        var r = result.Json.GetProperty("result");
        Assert.Equal("added", r.GetProperty("action").GetString());
        Assert.False(r.GetProperty("dryRun").GetBoolean());
        Assert.Contains("title", r.GetProperty("changes").EnumerateArray().Select(c => c.GetString()));
        Assert.Equal("published", r.GetProperty("event").GetProperty("status").GetString());
    }

    // L2-111 #1: Given no actor, then exit code 5 and nothing changes; SIXSTACK_ACTOR names the actor instead.
    [Fact]
    public async Task Add_without_an_actor_is_refused()
    {
        var before = await EventCount();

        var result = await cli.RunAsync("events", "add", "--file", file, "--yes");

        Assert.Equal(5, result.ExitCode);
        Assert.Contains("Name who is making this change with --actor <email> or SIXSTACK_ACTOR.", result.Output);
        Assert.Equal(before, await EventCount());
    }

    [Fact]
    public async Task Add_takes_the_actor_from_SIXSTACK_ACTOR()
    {
        using var withActor = await CliHarness.SeededAsync(new Dictionary<string, string?> { ["SIXSTACK_ACTOR"] = CliHarness.Moderator });

        var result = await withActor.RunAsync("events", "add", "--file", file, "--yes");

        Assert.Equal(0, result.ExitCode);
    }

    // L2-111 #2: Given an unknown actor or an organizer, then exit code 5 and nothing changes.
    [Theory]
    [InlineData(CliHarness.Organizer)]
    [InlineData("nobody@example.org")]
    public async Task Add_by_someone_who_is_not_a_moderator_is_refused(string actor)
    {
        var before = await EventCount();

        var result = await cli.RunAsync("events", "add", "--file", file, "--actor", actor, "--yes", "--json");

        Assert.Equal(5, result.ExitCode);
        Assert.Equal("actor", result.Json.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(before, await EventCount());
    }

    // L2-111 #3, L2-112 #2: Given --dry-run, then the change is shown, exit code 0, and nothing is stored or audited.
    [Fact]
    public async Task Add_dry_run_shows_the_event_and_writes_nothing()
    {
        var before = await EventCount();

        var result = await cli.RunAsync("events", "add", "--file", file, "--actor", CliHarness.Moderator, "--dry-run", "--json");

        Assert.Equal(0, result.ExitCode);
        Assert.True(result.Json.GetProperty("result").GetProperty("dryRun").GetBoolean());
        Assert.Equal("kotlin-multiplatform-night", result.Json.GetProperty("result").GetProperty("event").GetProperty("slug").GetString());
        Assert.Equal(before, await EventCount());
        Assert.Equal(0, await AuditCount());
    }

    // L2-111 #4: Given neither --yes nor --dry-run and redirected input, then exit code 6 and nothing changes.
    [Fact]
    public async Task Add_without_confirmation_writes_nothing()
    {
        var before = await EventCount();

        var result = await cli.RunAsync("events", "add", "--file", file, "--actor", CliHarness.Moderator);

        Assert.Equal(6, result.ExitCode);
        Assert.Contains("Kotlin Multiplatform Night", result.Output);
        Assert.Contains("Nothing changed. Re-run with --yes to apply.", result.Output);
        Assert.Equal(before, await EventCount());
        Assert.Equal(0, await AuditCount());
    }

    // L2-111 #5: Given an interactive run, then only "y" or "yes" applies the change.
    [Theory]
    [InlineData("n\n", 6)]
    [InlineData("\n", 6)]
    [InlineData("", 6)]
    [InlineData("y\n", 0)]
    [InlineData("YES\n", 0)]
    public async Task Add_asks_before_applying_when_interactive(string answer, int exitCode)
    {
        var before = await EventCount();

        var result = await cli.RunWithInputAsync(answer, "events", "add", "--file", file, "--actor", CliHarness.Moderator);

        Assert.Equal(exitCode, result.ExitCode);
        Assert.Contains("Apply? [y/N]", result.Output);
        Assert.Equal(before + (exitCode == 0 ? 1 : 0), await EventCount());
    }

    // L2-111: a --json run never prompts.
    [Fact]
    public async Task Add_with_json_never_prompts()
    {
        var result = await cli.RunWithInputAsync("y\n", "events", "add", "--file", file, "--actor", CliHarness.Moderator, "--json");

        Assert.Equal(6, result.ExitCode);
        Assert.Equal("notConfirmed", result.Json.GetProperty("error").GetProperty("code").GetString());
    }

    private Task<int> EventCount() => cli.QueryAsync(db => db.Events.CountAsync());

    private Task<int> AuditCount() => cli.QueryAsync(db => db.AuditEntries.CountAsync());
}
