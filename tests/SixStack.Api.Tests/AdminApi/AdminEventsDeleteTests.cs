using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.AdminApi;

/// <summary>L2-118, L2-119 and L2-122: soft-deleting an event over the admin API.</summary>
public sealed class AdminEventsDeleteTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private HttpClient client = null!;

    public async Task InitializeAsync() => client = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.Moderator)).Token);

    public Task DisposeAsync() => Task.CompletedTask;

    // L2-118 #1, L2-122 #1: Given a published event and its version in If-Match, then 200, the row stays with status
    // Deleted, the public page is 404, and EventDeleted names the token's owner via API.
    [Fact]
    public async Task Delete_soft_deletes_the_event_and_hides_it_from_the_site()
    {
        const string slug = "signals-all-the-way-down";
        var anonymous = factory.CreateHttpsClient();
        Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync($"/api/events/{slug}")).StatusCode);
        var before = await Event(slug);

        var response = await Delete(slug, before.Version);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await Json(response);
        Assert.Equal("deleted", result.GetProperty("action").GetString());
        Assert.False(result.GetProperty("dryRun").GetBoolean());
        Assert.Equal(["status"], result.GetProperty("changes").EnumerateArray().Select(c => c.GetString()));
        Assert.Equal(EventStatus.Deleted, (await Event(slug)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/events/{slug}")).StatusCode);
        var moderatorId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.Moderator).Select(u => u.Id).SingleAsync());
        var entry = Assert.Single(await factory.WithDbAsync(db => db.AuditEntries.Where(a => a.TargetId == before.Id).ToListAsync()));
        Assert.Equal("EventDeleted", entry.Action);
        Assert.Equal(moderatorId, entry.ActorId);
        Assert.Equal("was published; via API", entry.Details);
    }

    // L2-118 #2: Given an already deleted event, then 409 with reason deleted.
    [Fact]
    public async Task Delete_of_a_deleted_event_is_a_conflict()
    {
        const string slug = "azure-functions-deep-dive";
        await Delete(slug, (await Event(slug)).Version);

        var response = await Delete(slug, (await Event(slug)).Version);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("deleted", (await Json(response)).GetProperty("reason").GetString());
    }

    // L2-118 #3: Given an unknown id or slug, then 404.
    [Fact]
    public async Task Delete_of_an_unknown_event_is_404()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Delete("no-such-event", Guid.NewGuid())).StatusCode);
    }

    // L2-119 #1: Given ?dryRun=true, then 200 with dryRun true; nothing changes and nothing is audited.
    [Fact]
    public async Task Delete_dry_run_changes_nothing()
    {
        const string slug = "whats-new-in-dotnet-11-previews";
        var audit = await factory.WithDbAsync(db => db.AuditEntries.CountAsync());

        var response = await client.DeleteAsync($"/api/admin/events/{slug}?dryRun=true");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True((await Json(response)).GetProperty("dryRun").GetBoolean());
        Assert.Equal(EventStatus.Published, (await Event(slug)).Status);
        Assert.Equal(audit, await factory.WithDbAsync(db => db.AuditEntries.CountAsync()));
    }

    // L2-119 #3, #4: Given no If-Match, then 428; given a stale version, then 409 changed; nothing changes either way.
    [Fact]
    public async Task Delete_needs_the_current_version()
    {
        const string slug = "whats-new-in-dotnet-11-previews";

        var blind = await client.DeleteAsync($"/api/admin/events/{slug}");
        var stale = await Delete(slug, Guid.NewGuid());

        Assert.Equal((HttpStatusCode)428, blind.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        Assert.Equal("changed", (await Json(stale)).GetProperty("reason").GetString());
        Assert.Equal(EventStatus.Published, (await Event(slug)).Status);
    }

    private Task<HttpResponseMessage> Delete(string idOrSlug, Guid version)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/admin/events/{idOrSlug}");
        request.Headers.TryAddWithoutValidation("If-Match", $"\"{version}\"");
        return client.SendAsync(request);
    }

    private Task<Event> Event(string slug) => factory.WithDbAsync(db => db.Events.AsNoTracking().SingleAsync(e => e.Slug == slug));

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
}
