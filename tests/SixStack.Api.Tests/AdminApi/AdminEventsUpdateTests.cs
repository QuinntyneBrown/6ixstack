using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.AdminApi;

/// <summary>L2-117, L2-119 and L2-122: updating an event over the admin API.</summary>
public sealed class AdminEventsUpdateTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private const string Slug = "whats-new-in-dotnet-11-previews";

    private HttpClient client = null!;

    public async Task InitializeAsync() => client = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.Moderator)).Token);

    public Task DisposeAsync() => Task.CompletedTask;

    // L2-117 #1, L2-122 #1: Given the version in If-Match and a new title, then 200, only the title changes, the
    // ETag is the new version, and EventEdited names the token's owner and ends "via API".
    [Fact]
    public async Task Patch_changes_only_the_given_field_and_audits_it_via_api()
    {
        var before = await Event(Slug);

        var response = await Patch(Slug, """{ "title": "What's new in .NET 11" }""", before.Version);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await Json(response);
        Assert.Equal("updated", result.GetProperty("action").GetString());
        Assert.False(result.GetProperty("dryRun").GetBoolean());
        Assert.Equal(["title"], result.GetProperty("changes").EnumerateArray().Select(c => c.GetString()));
        var after = await Event(Slug);
        Assert.Equal("What's new in .NET 11", after.Title);
        Assert.Equal(before.Description, after.Description);
        Assert.Equal(before.StartsAtUtc, after.StartsAtUtc);
        Assert.NotEqual(before.Version, after.Version);
        Assert.Equal($"\"{after.Version}\"", response.Headers.ETag?.Tag);
        Assert.Equal(after.Version, result.GetProperty("event").GetProperty("version").GetGuid());
        var moderatorId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.Moderator).Select(u => u.Id).SingleAsync());
        // Other tests in this class may also edit the event; each of their entries is from the token's owner via API.
        var entries = await factory.WithDbAsync(db => db.AuditEntries.Where(a => a.TargetId == after.Id && a.Action == "EventEdited").ToListAsync());
        Assert.All(entries, e => Assert.Equal(moderatorId, e.ActorId));
        Assert.All(entries, e => Assert.EndsWith("; via API", e.Details));
        Assert.Single(entries, e => e.Details == "title; via API");
    }

    // L2-117 #2: Given a new start time for a published event, then its SEQUENCE rises and the time-change alert is
    // raised, as for a moderator edit in the web app.
    [Fact]
    public async Task Patch_of_a_published_start_time_raises_the_alert_and_sequence()
    {
        const string slug = "signals-all-the-way-down";
        var before = await Event(slug);
        Assert.Equal(EventStatus.Published, before.Status);

        var response = await Patch(slug, """{ "startTime": "19:00", "endTime": "21:00" }""", before.Version);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var after = await Event(slug);
        Assert.Equal(before.StartsAtUtc, after.PreviousStartsAtUtc);
        Assert.Equal(before.Sequence + 1, after.Sequence);
    }

    // L2-117 #3: Given a date that has passed, then 400 validation problem details hold date, and nothing changes.
    [Fact]
    public async Task Patch_with_a_past_date_is_refused()
    {
        var before = await Event(Slug);

        var response = await Patch(Slug, """{ "date": "2026-10-01" }""", before.Version);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Choose a date that hasn't passed.", (await Json(response)).GetProperty("errors").GetProperty("date").EnumerateArray().Select(m => m.GetString()));
        Assert.Equal(before.Version, (await Event(Slug)).Version);
    }

    // L2-117 #4: Given an unknown or a deleted event, then 404; given a past or a cancelled event, then 409 read-only.
    [Fact]
    public async Task Patch_of_unknown_deleted_past_or_cancelled_events_is_refused()
    {
        await Change("azure-functions-deep-dive", e => e.Status = EventStatus.Deleted);
        await Change("angular-toronto-lightning-talks", e =>
        {
            e.CancelledAtUtc = DateTimeOffset.Parse("2026-11-01T12:00:00Z");
            e.CancellationReason = "Venue flooded.";
        });

        Assert.Equal(HttpStatusCode.NotFound, (await Patch("no-such-event", """{ "title": "X" }""", Guid.NewGuid())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Patch("azure-functions-deep-dive", """{ "title": "X" }""", (await Event("azure-functions-deep-dive")).Version)).StatusCode);
        foreach (var slug in new[] { "minimal-apis-in-practice-october", "angular-toronto-lightning-talks" })
        {
            var response = await Patch(slug, """{ "title": "X" }""", (await Event(slug)).Version);
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            Assert.Equal("read-only", (await Json(response)).GetProperty("reason").GetString());
            Assert.NotEqual("X", (await Event(slug)).Title);
        }
    }

    // L2-119 #1: Given ?dryRun=true, then 200 with dryRun true and the changed fields; nothing changes and nothing is
    // audited. A dry run needs no If-Match.
    [Fact]
    public async Task Patch_dry_run_previews_without_writing()
    {
        var before = await Event(Slug);
        var audit = await factory.WithDbAsync(db => db.AuditEntries.CountAsync());

        var response = await client.PatchAsync($"/api/admin/events/{Slug}?dryRun=true", Body("""{ "description": "A new agenda." }"""));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await Json(response);
        Assert.True(result.GetProperty("dryRun").GetBoolean());
        Assert.Equal(["description"], result.GetProperty("changes").EnumerateArray().Select(c => c.GetString()));
        Assert.Equal(before.Version, (await Event(Slug)).Version);
        Assert.Equal(audit, await factory.WithDbAsync(db => db.AuditEntries.CountAsync()));
    }

    // L2-119 #3: Given an applied PATCH without If-Match, then 428 problem details and nothing changes.
    [Fact]
    public async Task Patch_without_if_match_is_428()
    {
        var before = await Event(Slug);

        var response = await client.PatchAsync($"/api/admin/events/{Slug}", Body("""{ "title": "Blind write" }"""));

        Assert.Equal((HttpStatusCode)428, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(before.Version, (await Event(Slug)).Version);
    }

    // L2-119 #4: Given If-Match with a version other than the current one, then 409 changed and nothing changes.
    [Fact]
    public async Task Patch_with_a_stale_version_is_409()
    {
        var before = await Event(Slug);

        var response = await Patch(Slug, """{ "title": "Stale write" }""", Guid.NewGuid());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await Json(response);
        Assert.Equal("changed", problem.GetProperty("reason").GetString());
        Assert.Equal("Someone else changed this event.", problem.GetProperty("title").GetString());
        Assert.Equal(before.Version, (await Event(Slug)).Version);
    }

    // L2-119 #5: Given If-Match that is not a version, then 400. A weak or unquoted version is accepted.
    [Fact]
    public async Task Patch_reads_if_match_leniently_but_refuses_garbage()
    {
        var bad = new HttpRequestMessage(HttpMethod.Patch, $"/api/admin/events/{Slug}") { Content = Body("""{ "title": "X" }""") };
        bad.Headers.TryAddWithoutValidation("If-Match", "\"not-a-version\"");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(bad)).StatusCode);

        var weak = new HttpRequestMessage(HttpMethod.Patch, $"/api/admin/events/{Slug}") { Content = Body("""{ "description": "Weak validator." }""") };
        weak.Headers.TryAddWithoutValidation("If-Match", $"W/\"{(await Event(Slug)).Version}\"");
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(weak)).StatusCode);
    }

    private Task<HttpResponseMessage> Patch(string idOrSlug, string json, Guid version)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/admin/events/{idOrSlug}") { Content = Body(json) };
        request.Headers.TryAddWithoutValidation("If-Match", $"\"{version}\"");
        return client.SendAsync(request);
    }

    private Task<Event> Event(string slug) => factory.WithDbAsync(db => db.Events.AsNoTracking().SingleAsync(e => e.Slug == slug));

    private Task<int> Change(string slug, Action<Event> change) => factory.WithDbAsync(async db =>
    {
        change(await db.Events.SingleAsync(e => e.Slug == slug));
        return await db.SaveChangesAsync();
    });

    private static StringContent Body(string json) => new(json, Encoding.UTF8, "application/json");

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
}
