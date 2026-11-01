using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.AdminApi;

/// <summary>L2-115 and L2-123 #4: listing and reading events over the admin API.</summary>
public sealed class AdminEventsReadTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private HttpClient client = null!;

    public async Task InitializeAsync() => client = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.Moderator)).Token);

    public Task DisposeAsync() => Task.CompletedTask;

    // L2-115 #1: Given status=published and from=to=2026-11-03, then 200 lists only the published events that start
    // on November 3 in Toronto, earliest first, in the CLI's list shape.
    [Fact]
    public async Task List_filters_by_status_and_toronto_dates()
    {
        var response = await client.GetAsync("/api/admin/events?status=published&from=2026-11-03&to=2026-11-03");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await Json(response);
        Assert.Equal(1, body.GetProperty("count").GetInt32());
        var e = Assert.Single(body.GetProperty("events").EnumerateArray());
        Assert.Equal("whats-new-in-dotnet-11-previews", e.GetProperty("slug").GetString());
        Assert.Equal("published", e.GetProperty("status").GetString());
        Assert.Equal("inPerson", e.GetProperty("format").GetString());
        Assert.Equal(DateTimeOffset.Parse("2026-11-03T23:00:00Z"), e.GetProperty("startsAtUtc").GetDateTimeOffset());
        Assert.True(e.TryGetProperty("version", out _));
    }

    // L2-115 #1: Given search and take, then only matching events, at most take of them.
    [Fact]
    public async Task List_searches_and_takes()
    {
        var searched = await Json(await client.GetAsync("/api/admin/events?search=AZURE&take=500"));
        var taken = await Json(await client.GetAsync("/api/admin/events?take=2"));

        Assert.Contains(searched.GetProperty("events").EnumerateArray(), e => e.GetProperty("slug").GetString() == "azure-data-ai-day-gta");
        Assert.All(searched.GetProperty("events").EnumerateArray(), e => Assert.True(
            e.GetProperty("title").GetString()!.Contains("azure", StringComparison.OrdinalIgnoreCase)
            || e.GetProperty("organizerName").GetString()!.Contains("azure", StringComparison.OrdinalIgnoreCase)));
        Assert.Equal(2, taken.GetProperty("events").GetArrayLength());
    }

    // L2-115 #2: Given a bad status, date or take, then 400 validation problem details name the parameter.
    [Theory]
    [InlineData("status=maybe", "status")]
    [InlineData("from=11/03/2026", "from")]
    [InlineData("to=soon", "to")]
    [InlineData("take=0", "take")]
    [InlineData("take=501", "take")]
    public async Task List_refuses_bad_parameters(string query, string parameter)
    {
        var response = await client.GetAsync($"/api/admin/events?{query}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.True((await Json(response)).GetProperty("errors").TryGetProperty(parameter, out _), parameter);
    }

    // L2-115 #3: Given a soft-deleted event, then it is listed only with status=deleted, and can still be read.
    [Fact]
    public async Task Deleted_events_are_listed_only_when_asked_for()
    {
        const string slug = "minimal-apis-in-practice-october";
        await factory.WithDbAsync(async db =>
        {
            (await db.Events.SingleAsync(e => e.Slug == slug)).Status = EventStatus.Deleted;
            return await db.SaveChangesAsync();
        });

        var all = await client.GetStringAsync("/api/admin/events?take=500");
        var deleted = await client.GetStringAsync("/api/admin/events?status=deleted");
        var one = await Json(await client.GetAsync($"/api/admin/events/{slug}"));

        Assert.DoesNotContain(slug, all);
        Assert.Contains(slug, deleted);
        Assert.Equal("deleted", one.GetProperty("status").GetString());
    }

    // L2-115 #4: Given the slug or the id, then 200 returns the event's state and the edit form's fields, and the
    // ETag is the quoted version.
    [Fact]
    public async Task Get_returns_the_event_by_slug_or_id_with_its_version_as_etag()
    {
        var bySlug = await client.GetAsync("/api/admin/events/whats-new-in-dotnet-11-previews");

        Assert.Equal(HttpStatusCode.OK, bySlug.StatusCode);
        var e = await Json(bySlug);
        var id = e.GetProperty("id").GetGuid();
        var version = e.GetProperty("version").GetGuid();
        Assert.Equal($"\"{version}\"", bySlug.Headers.ETag?.Tag);
        Assert.Equal("What's new in the .NET 11 previews", e.GetProperty("title").GetString());
        foreach (var field in new[] { "organizerName", "description", "topics", "date", "timeZoneId", "startTime", "endTime", "format", "venueName", "city", "streetAddress", "streamUrl", "isFree", "priceCad", "ticketUrl" })
        {
            Assert.True(e.TryGetProperty(field, out _), field);
        }

        var byId = await Json(await client.GetAsync($"/api/admin/events/{id}"));
        Assert.Equal("whats-new-in-dotnet-11-previews", byId.GetProperty("slug").GetString());
    }

    // L2-115 #5: Given an id or slug that matches no event, then 404 problem details.
    [Fact]
    public async Task Get_of_an_unknown_event_is_404()
    {
        var response = await client.GetAsync("/api/admin/events/no-such-event");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // L2-123 #4: Given an event with a submitter email, then the list and a read leave it out; showContact=true
    // shows it.
    [Fact]
    public async Task Submitter_email_appears_only_with_show_contact()
    {
        var list = await client.GetStringAsync("/api/admin/events?take=500");
        var read = await client.GetStringAsync("/api/admin/events/azure-data-ai-day-gta");
        var shown = await Json(await client.GetAsync("/api/admin/events/azure-data-ai-day-gta?showContact=true"));

        foreach (var body in new[] { list, read })
        {
            Assert.DoesNotContain(HttpClientExtensions.Organizer, body);
            Assert.DoesNotContain("submitterEmail", body);
        }

        Assert.Equal(HttpClientExtensions.Organizer, shown.GetProperty("submitterEmail").GetString());
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
}
