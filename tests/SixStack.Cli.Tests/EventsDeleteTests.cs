using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Events;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Cli.Tests;

/// <summary>Acceptance tests for <c>events delete</c> and how a deleted event shows (L2-105, L2-106, L2-109, L2-112).</summary>
public sealed class EventsDeleteTests : IAsyncLifetime
{
    private const string Slug = "signals-all-the-way-down";

    private CliHarness cli = null!;

    public async Task InitializeAsync() => cli = await CliHarness.SeededAsync();

    public Task DisposeAsync()
    {
        cli.Dispose();
        return Task.CompletedTask;
    }

    // L2-109 #1, L2-112 #1: Given a published event and --yes, when delete runs, then the row stays with status
    // Deleted, the public event page is not found, and EventDeleted names the actor and "via CLI".
    [Fact]
    public async Task Delete_soft_deletes_the_event_and_hides_it_from_the_site()
    {
        Assert.Equal(Slug, (await cli.SendAsync(new GetEventDetailQuery(Slug))).Slug);

        var result = await cli.RunAsync("events", "delete", Slug, "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(0, result.ExitCode);
        Assert.Contains("Deleted signals-all-the-way-down", result.Output);
        var e = await Event();
        Assert.Equal(EventStatus.Deleted, e.Status);
        await Assert.ThrowsAsync<NotFoundException>(() => cli.SendAsync(new GetEventDetailQuery(Slug)));
        var upcoming = await cli.SendAsync(new GetUpcomingEventsQuery());
        Assert.DoesNotContain(Slug, System.Text.Json.JsonSerializer.Serialize(upcoming));
        var entry = Assert.Single(await cli.QueryAsync(db => db.AuditEntries.Where(a => a.TargetId == e.Id).ToListAsync()));
        Assert.Equal("EventDeleted", entry.Action);
        Assert.Equal("was published; via CLI", entry.Details);
    }

    // L2-109 #2: Given the deleted event, then get still shows it with status deleted.
    [Fact]
    public async Task Get_shows_a_deleted_event_as_deleted()
    {
        await cli.RunAsync("events", "delete", Slug, "--actor", CliHarness.Moderator, "--yes");

        var result = await cli.RunAsync("events", "get", Slug, "--json");

        Assert.Equal(0, result.ExitCode);
        Assert.Equal("deleted", result.Json.GetProperty("event").GetProperty("status").GetString());
    }

    // L2-105 #5: Given a deleted event, then list leaves it out unless --status deleted is given.
    [Fact]
    public async Task List_shows_deleted_events_only_when_asked()
    {
        await cli.RunAsync("events", "delete", Slug, "--actor", CliHarness.Moderator, "--yes");

        var all = await cli.RunAsync("events", "list", "--take", "500");
        var deleted = await cli.RunAsync("events", "list", "--status", "deleted");

        Assert.DoesNotContain(Slug, all.Output);
        Assert.Contains(Slug, deleted.Output);
    }

    // L2-109 #3: Given an already deleted event, then exit code 4.
    [Fact]
    public async Task Delete_of_a_deleted_event_is_a_conflict()
    {
        await cli.RunAsync("events", "delete", Slug, "--actor", CliHarness.Moderator, "--yes");

        var result = await cli.RunAsync("events", "delete", Slug, "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(4, result.ExitCode);
        Assert.Contains("This event is already deleted.", result.Output);
    }

    // L2-109 #4: Given an unknown id or slug, then exit code 3.
    [Fact]
    public async Task Delete_of_an_unknown_event_is_not_found()
    {
        var result = await cli.RunAsync("events", "delete", Guid.NewGuid().ToString(), "--actor", CliHarness.Moderator, "--yes", "--json");

        Assert.Equal(3, result.ExitCode);
        Assert.Equal("notFound", result.Json.GetProperty("error").GetProperty("code").GetString());
    }

    // L2-108 #4 for delete: a stale --if-version is a conflict.
    [Fact]
    public async Task Delete_with_a_stale_version_is_a_conflict()
    {
        var result = await cli.RunAsync("events", "delete", Slug, "--if-version", Guid.NewGuid().ToString(), "--actor", CliHarness.Moderator, "--yes");

        Assert.Equal(4, result.ExitCode);
        Assert.Equal(EventStatus.Published, (await Event()).Status);
    }

    // L2-111 #3, L2-112 #2: a dry run deletes nothing and records nothing.
    [Fact]
    public async Task Delete_dry_run_writes_nothing()
    {
        var result = await cli.RunAsync("events", "delete", Slug, "--actor", CliHarness.Moderator, "--dry-run", "--json");

        Assert.Equal(0, result.ExitCode);
        Assert.Equal("deleted", result.Json.GetProperty("result").GetProperty("action").GetString());
        Assert.True(result.Json.GetProperty("result").GetProperty("dryRun").GetBoolean());
        Assert.Equal(EventStatus.Published, (await Event()).Status);
        Assert.Equal(0, await cli.QueryAsync(db => db.AuditEntries.CountAsync()));
    }

    // L2-111 #4: without --yes, nothing is deleted.
    [Fact]
    public async Task Delete_without_confirmation_writes_nothing()
    {
        var result = await cli.RunAsync("events", "delete", Slug, "--actor", CliHarness.Moderator);

        Assert.Equal(6, result.ExitCode);
        Assert.Equal(EventStatus.Published, (await Event()).Status);
    }

    private Task<Event> Event() => cli.QueryAsync(db => db.Events.AsNoTracking().SingleAsync(e => e.Slug == Slug));
}
