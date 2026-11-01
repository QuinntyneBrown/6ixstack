using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.AdminApi;

/// <summary>L2-116, L2-119 and L2-122: adding an event over the admin API.</summary>
public sealed class AdminEventsAddTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
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
          "city": "Toronto"
        }
        """;

    private HttpClient client = null!;

    public async Task InitializeAsync() => client = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.Moderator)).Token);

    public Task DisposeAsync() => Task.CompletedTask;

    // L2-116 #1, L2-122 #1: Given a valid body, then 201 with a Location, the event is published with a slug from
    // its title and no submitter email, and EventAdded names the token's owner and ends "via API".
    [Fact]
    public async Task Add_publishes_the_event_and_audits_it_via_api()
    {
        var response = await client.PostAsync("/api/admin/events", Body(ValidEvent.Replace("Kotlin Multiplatform Night", "Compose Multiplatform Night")));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await Json(response);
        Assert.Equal("added", result.GetProperty("action").GetString());
        Assert.False(result.GetProperty("dryRun").GetBoolean());
        Assert.Contains("title", result.GetProperty("changes").EnumerateArray().Select(c => c.GetString()));
        var id = result.GetProperty("event").GetProperty("id").GetGuid();
        Assert.Equal($"/api/admin/events/{id}", response.Headers.Location?.OriginalString);
        Assert.Equal("compose-multiplatform-night", result.GetProperty("event").GetProperty("slug").GetString());

        var e = await factory.WithDbAsync(db => db.Events.SingleAsync(x => x.Id == id));
        Assert.Equal(EventStatus.Published, e.Status);
        Assert.Null(e.SubmitterEmail);
        Assert.Equal(0, e.PriceCents);
        Assert.Equal("America/Toronto", e.TimeZoneId);
        var moderatorId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.Moderator).Select(u => u.Id).SingleAsync());
        var entry = Assert.Single(await factory.WithDbAsync(db => db.AuditEntries.Where(a => a.TargetId == id).ToListAsync()));
        Assert.Equal("EventAdded", entry.Action);
        Assert.Equal(moderatorId, entry.ActorId);
        Assert.Equal("published; via API", entry.Details);
    }

    // L2-116 #2, L2-122 #2: Given no title and a ticket link without https://, then 400 validation problem details
    // on the form's field names, and nothing is stored or audited.
    [Fact]
    public async Task Add_refuses_invalid_details_field_by_field()
    {
        var before = await Counts();

        var response = await client.PostAsync("/api/admin/events", Body(ValidEvent
            .Replace("\"title\": \"Kotlin Multiplatform Night\",", string.Empty)
            .Replace("\"city\": \"Toronto\"", "\"city\": \"Toronto\", \"ticketUrl\": \"http://tickets.example.com\"")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var errors = (await Json(response)).GetProperty("errors");
        Assert.Contains("Enter a title for the event.", errors.GetProperty("title").EnumerateArray().Select(m => m.GetString()));
        Assert.Contains("Enter a full link that starts with https://", errors.GetProperty("ticketUrl").EnumerateArray().Select(m => m.GetString()));
        Assert.Equal(before, await Counts());
    }

    // L2-116 #3: Given a property the form does not have, or a body that is not JSON, then 400 and nothing is stored.
    [Theory]
    [InlineData("{ \"title\": \"Night\", \"submitterEmail\": \"me@example.com\" }")]
    [InlineData("title=Night")]
    [InlineData("{ \"title\": ")]
    public async Task Add_refuses_unknown_properties_and_bad_json(string body)
    {
        var before = await Counts();

        var response = await client.PostAsync("/api/admin/events", Body(body));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(before, await Counts());
    }

    // L2-119 #1, L2-122 #2: Given ?dryRun=true on a valid add, then 200 with dryRun true, and nothing is stored or audited.
    [Fact]
    public async Task Add_dry_run_previews_without_writing()
    {
        var before = await Counts();

        var response = await client.PostAsync("/api/admin/events?dryRun=true", Body(ValidEvent));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await Json(response);
        Assert.True(result.GetProperty("dryRun").GetBoolean());
        Assert.Equal("kotlin-multiplatform-night", result.GetProperty("event").GetProperty("slug").GetString());
        Assert.Equal(before, await Counts());
    }

    // L2-119 #2: Given ?dryRun=true on an invalid add, then 400 validation problem details.
    [Fact]
    public async Task Add_dry_run_validates()
    {
        var response = await client.PostAsync("/api/admin/events?dryRun=true", Body(ValidEvent.Replace("2026-12-03", "2026-10-01")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.True((await Json(response)).GetProperty("errors").TryGetProperty("date", out _));
    }

    private static StringContent Body(string json) => new(json, Encoding.UTF8, "application/json");

    private Task<(int Events, int Audit)> Counts() =>
        factory.WithDbAsync(async db => (await db.Events.CountAsync(), await db.AuditEntries.CountAsync()));

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
}
