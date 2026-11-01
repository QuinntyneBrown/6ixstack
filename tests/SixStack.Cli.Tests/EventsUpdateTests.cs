using Microsoft.EntityFrameworkCore;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Cli.Tests;

/// <summary>Acceptance tests for <c>events update</c> (L2-108, L2-111, L2-112).</summary>
public sealed class EventsUpdateTests : IAsyncLifetime
{
    private const string Slug = "whats-new-in-dotnet-11-previews";

    private CliHarness cli = null!;

    public async Task InitializeAsync() => cli = await CliHarness.SeededAsync();

    public Task DisposeAsync()
    {
        cli.Dispose();
        return Task.CompletedTask;
    }

    // L2-108 #1, L2-112 #1: Given a published event and --title with --yes, when update runs, then only the title
    // changes, the output lists "title", and one EventEdited entry names the actor and "via CLI".
    [Fact]
    public async Task Update_changes_only_the_given_field_and_audits_it()
    {
        var before = await Event(Slug);

        var result = await cli.RunAsync("events", "update", Slug, "--title", "New title", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(0, result.ExitCode);
        Assert.Contains("changes: title", result.Output);
        var after = await Event(Slug);
        Assert.Equal("New title", after.Title);
        Assert.Equal(before.Description, after.Description);
        Assert.Equal(before.StartsAtUtc, after.StartsAtUtc);
        Assert.Equal(before.Venue?.Address, after.Venue?.Address);
        Assert.Equal(EventStatus.Published, after.Status);
        Assert.NotEqual(before.Version, after.Version);
        var moderatorId = await cli.QueryAsync(db => db.Users.Where(u => u.Email == CliHarness.Moderator).Select(u => u.Id).SingleAsync());
        var entry = Assert.Single(await cli.QueryAsync(db => db.AuditEntries.Where(a => a.TargetId == after.Id).ToListAsync()));
        Assert.Equal("EventEdited", entry.Action);
        Assert.Equal(moderatorId, entry.ActorId);
        Assert.Equal("title; via CLI", entry.Details);
    }

    // L2-108 (L2-054 #4 through the moderator edit path): a new start on a published event raises the time-change
    // alert and the feed SEQUENCE.
    [Fact]
    public async Task Update_of_a_published_start_time_raises_the_alert_and_sequence()
    {
        var before = await Event(Slug);

        var result = await cli.RunAsync("events", "update", before.Id.ToString(), "--start", "18:30", "--end", "21:00", "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(0, result.ExitCode);
        Assert.Equal(["startTime", "endTime"], result.Json.GetProperty("result").GetProperty("changes").EnumerateArray().Select(c => c.GetString()));
        var after = await Event(Slug);
        Assert.Equal(before.StartsAtUtc, after.PreviousStartsAtUtc);
        Assert.Equal(before.Sequence + 1, after.Sequence);
    }

    // L2-108: a patch file sets several fields, and an empty value clears an optional one.
    [Fact]
    public async Task Update_applies_a_patch_file()
    {
        var file = Path.GetTempFileName();
        await File.WriteAllTextAsync(file, """{ "description": "Updated agenda.", "ticketUrl": "https://tickets.example.org/dotnet" }""");

        var result = await cli.RunAsync("events", "update", Slug, "--file", file, "--actor", CliHarness.Moderator, "--yes");
        File.Delete(file);

        Assert.Equal(0, result.ExitCode);
        Assert.Equal("https://tickets.example.org/dotnet", (await Event(Slug)).TicketUrl);

        var cleared = await cli.RunAsync("events", "update", Slug, "--ticket-url", "", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(0, cleared.ExitCode);
        Assert.Null((await Event(Slug)).TicketUrl);
    }

    // L2-108 #2, L2-112 #2: Given a date that has passed, then exit code 2, and nothing changes or is audited.
    [Fact]
    public async Task Update_with_an_invalid_value_changes_nothing()
    {
        var before = await Event(Slug);

        var result = await cli.RunAsync("events", "update", Slug, "--date", "2026-10-01", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(2, result.ExitCode);
        Assert.Contains("date: Choose a date that hasn't passed.", result.Output);
        Assert.Equal(before.StartsAtUtc, (await Event(Slug)).StartsAtUtc);
        Assert.Equal(0, await cli.QueryAsync(db => db.AuditEntries.CountAsync()));
    }

    // L2-108 #3: Given an unknown id or slug, or a deleted event, then exit code 3.
    [Fact]
    public async Task Update_of_an_unknown_event_is_not_found()
    {
        var result = await cli.RunAsync("events", "update", "no-such-event", "--title", "X", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(3, result.ExitCode);
        Assert.Contains("No event matches 'no-such-event'.", result.Output);
    }

    [Fact]
    public async Task Update_of_a_deleted_event_is_not_found()
    {
        await Change(Slug, e => e.Status = EventStatus.Deleted);

        var result = await cli.RunAsync("events", "update", Slug, "--title", "X", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(3, result.ExitCode);
    }

    // L2-108 #4: Given --if-version other than the current version, then exit code 4 and nothing changes.
    [Fact]
    public async Task Update_with_a_stale_version_is_a_conflict()
    {
        var result = await cli.RunAsync("events", "update", Slug, "--title", "X", "--if-version", Guid.NewGuid().ToString(), "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(4, result.ExitCode);
        Assert.Equal("conflict", result.Json.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal("Someone else changed this event.", result.Json.GetProperty("error").GetProperty("message").GetString());
        Assert.NotEqual("X", (await Event(Slug)).Title);
    }

    // L2-108 #4: the current version from events get lets the update through.
    [Fact]
    public async Task Update_with_the_current_version_applies()
    {
        var version = (await cli.RunAsync("events", "get", Slug, "--json")).Json.GetProperty("event").GetProperty("version").GetString()!;

        var result = await cli.RunAsync("events", "update", Slug, "--title", "X", "--if-version", version, "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(0, result.ExitCode);
        Assert.Equal("X", (await Event(Slug)).Title);
    }

    [Fact]
    public async Task Update_with_a_malformed_version_is_a_usage_error()
    {
        var result = await cli.RunAsync("events", "update", Slug, "--title", "X", "--if-version", "v2", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(1, result.ExitCode);
        Assert.Contains("--if-version", result.Output);
    }

    // L2-108 #5: Given a past or a cancelled event, then exit code 4 and nothing changes.
    [Fact]
    public async Task Update_of_a_past_event_is_a_conflict()
    {
        var result = await cli.RunAsync("events", "update", "minimal-apis-in-practice-october", "--title", "X", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(4, result.ExitCode);
        Assert.Contains("This event has ended, so it can’t be edited.", result.Output);
    }

    [Fact]
    public async Task Update_of_a_cancelled_event_is_a_conflict()
    {
        await Change(Slug, e =>
        {
            e.CancelledAtUtc = DateTimeOffset.Parse("2026-11-01T12:00:00Z");
            e.CancellationReason = "Venue flooded.";
        });

        var result = await cli.RunAsync("events", "update", Slug, "--title", "X", "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(4, result.ExitCode);
        Assert.NotEqual("X", (await Event(Slug)).Title);
    }

    // L2-111 #3: Given --dry-run, then the changed fields are shown and nothing changes.
    [Fact]
    public async Task Update_dry_run_shows_the_changes_and_writes_nothing()
    {
        var result = await cli.RunAsync("events", "update", Slug, "--title", "New title", "--actor", CliHarness.Moderator, "--dry-run");

        Assert.Equal(0, result.ExitCode);
        Assert.Contains("changes: title", result.Output);
        Assert.NotEqual("New title", (await Event(Slug)).Title);
        Assert.Equal(0, await cli.QueryAsync(db => db.AuditEntries.CountAsync()));
    }

    // L2-111 #4: Given no --yes and redirected input, then exit code 6 and nothing changes.
    [Fact]
    public async Task Update_without_confirmation_writes_nothing()
    {
        var result = await cli.RunAsync("events", "update", Slug, "--title", "New title", "--actor", CliHarness.Moderator);

        Assert.Equal(6, result.ExitCode);
        Assert.Contains("changes: title", result.Output);
        Assert.NotEqual("New title", (await Event(Slug)).Title);
    }

    // L2-111 #1: Given no actor, then exit code 5.
    [Fact]
    public async Task Update_without_an_actor_is_refused()
    {
        var result = await cli.RunAsync("events", "update", Slug, "--title", "New title", "--yes");

        Assert.Equal(5, result.ExitCode);
    }

    private Task<Event> Event(string slug) => cli.QueryAsync(db => db.Events.AsNoTracking().SingleAsync(e => e.Slug == slug));

    private Task Change(string slug, Action<Event> change) => cli.QueryAsync(async db =>
    {
        change(await db.Events.SingleAsync(e => e.Slug == slug));
        return await db.SaveChangesAsync();
    });
}
