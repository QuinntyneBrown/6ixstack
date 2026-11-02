using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.AdminApi;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Application.Events;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-128 and L2-126 #4: a change saved through the application evicts the cached listings.</summary>
public sealed class EventListingEvictionTests
{
    private static async Task<string> Body(ApiFactory factory, string url)
    {
        var response = await factory.CreateHttpsClient().GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadAsStringAsync();
    }

    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static Task<Guid> IdOf(ApiFactory factory, string slug) =>
        factory.WithDbAsync(db => db.Events.Where(e => e.Slug == slug).Select(e => e.Id).SingleAsync());

    private static StringContent Json(string json) => new(json, Encoding.UTF8, "application/json");

    // L2-128 #1
    [Fact]
    public async Task Approving_a_submission_shows_it_in_the_next_list()
    {
        using var factory = new ApiFactory();
        Assert.DoesNotContain("Rust in production at scale", await Body(factory, "/api/events?page=2"));
        var jordan = await As(factory, HttpClientExtensions.Moderator);

        var approved = await jordan.PostAsync($"/api/moderation/submissions/{await IdOf(factory, "rust-in-production-at-scale")}/approve", null);

        Assert.Equal(HttpStatusCode.OK, approved.StatusCode);
        Assert.Contains("Rust in production at scale", await Body(factory, "/api/events?page=2"));
    }

    // L2-128 #2
    [Fact]
    public async Task An_organizer_edit_shows_in_the_next_list()
    {
        using var factory = new ApiFactory();
        await Body(factory, "/api/events");
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var id = await IdOf(factory, "azure-data-ai-day-gta");
        var details = await priya.GetFromJsonAsync<JsonElement>($"/api/organizer/events/{id}");
        var form = JsonSerializer.Deserialize<Dictionary<string, object?>>(details.GetProperty("details").GetRawText())!;
        form["title"] = "Azure Data & AI Day GTA 2026";

        var saved = await priya.PutAsJsonAsync($"/api/organizer/events/{id}", form);

        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        Assert.Contains("Azure Data & AI Day GTA 2026", await Body(factory, "/api/events"));
    }

    // L2-128 #2
    [Fact]
    public async Task An_organizer_cancellation_takes_the_event_out_of_the_next_list()
    {
        using var factory = new ApiFactory();
        Assert.Contains("azure-data-ai-day-gta", await Body(factory, "/api/events"));
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var cancelled = await priya.PostAsJsonAsync($"/api/organizer/events/{await IdOf(factory, "azure-data-ai-day-gta")}/cancel",
            new { reason = "Our venue double-booked Hall B. We will post a new date here.", notifyAttendees = false, confirmationName = "azure data & ai day gta" });

        Assert.Equal(HttpStatusCode.OK, cancelled.StatusCode);
        Assert.DoesNotContain("azure-data-ai-day-gta", await Body(factory, "/api/events"));
    }

    // L2-128 #3
    [Fact]
    public async Task Admin_api_adds_updates_and_deletes_show_in_the_next_list()
    {
        using var factory = new ApiFactory();
        var admin = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.Moderator)).Token);
        await Body(factory, "/api/events");

        var added = await admin.PostAsync("/api/admin/events", Json("""
            {
              "title": "Kotlin Multiplatform Night", "organizerName": "Toronto Mobile Devs",
              "description": "Sharing code between Android and iOS, with two short talks.", "topics": ["ai"],
              "date": "2026-11-06", "startTime": "18:30", "endTime": "20:30", "format": "inPerson",
              "venueName": "MaRS Discovery District", "streetAddress": "101 College St", "city": "Toronto"
            }
            """));
        Assert.Equal(HttpStatusCode.Created, added.StatusCode);
        Assert.Contains("Kotlin Multiplatform Night", await Body(factory, "/api/events"));

        var update = new HttpRequestMessage(HttpMethod.Patch, "/api/admin/events/kotlin-multiplatform-night") { Content = Json("""{ "title": "Compose Multiplatform Night" }""") };
        update.Headers.TryAddWithoutValidation("If-Match", (await admin.GetAsync("/api/admin/events/kotlin-multiplatform-night")).Headers.ETag!.Tag);
        Assert.Equal(HttpStatusCode.OK, (await admin.SendAsync(update)).StatusCode);
        Assert.Contains("Compose Multiplatform Night", await Body(factory, "/api/events"));

        var delete = new HttpRequestMessage(HttpMethod.Delete, "/api/admin/events/kotlin-multiplatform-night");
        delete.Headers.TryAddWithoutValidation("If-Match", (await admin.GetAsync("/api/admin/events/kotlin-multiplatform-night")).Headers.ETag!.Tag);
        Assert.Equal(HttpStatusCode.OK, (await admin.SendAsync(delete)).StatusCode);
        Assert.DoesNotContain("Compose Multiplatform Night", await Body(factory, "/api/events"));
    }

    // L2-128 #4
    [Fact]
    public async Task Featuring_another_event_shows_it_as_the_next_featured_event()
    {
        using var factory = new ApiFactory();
        Assert.Contains("azure-data-ai-day-gta", await Body(factory, "/api/events/featured"));

        await factory.WithDbAsync(async db =>
        {
            (await db.Events.SingleAsync(e => e.Slug == "azure-data-ai-day-gta")).IsFeatured = false;
            (await db.Events.SingleAsync(e => e.Slug == "bedrock-in-the-real-world")).IsFeatured = true;
            return await db.SaveChangesAsync();
        });

        Assert.Contains("bedrock-in-the-real-world", await Body(factory, "/api/events/featured"));
    }

    // L2-128 #5
    [Fact]
    public async Task Coordinates_from_the_geocoding_job_show_on_the_next_map()
    {
        using var factory = new ApiFactory();
        await factory.WithDbAsync(async db =>
        {
            var e = await db.Events.SingleAsync(x => x.Slug == "bedrock-in-the-real-world");
            e.Venue!.Latitude = null;
            e.Venue.Longitude = null;
            return await db.SaveChangesAsync();
        });
        Assert.DoesNotContain(await Points(factory), slug => slug == "bedrock-in-the-real-world");

        using (var scope = factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<ISender>().Send(new LocateVenuesCommand());
        }

        Assert.Contains(await Points(factory), slug => slug == "bedrock-in-the-real-world");
    }

    private static async Task<List<string?>> Points(ApiFactory factory) =>
        [.. JsonDocument.Parse(await Body(factory, "/api/events/map")).RootElement.GetProperty("points").EnumerateArray().Select(p => p.GetProperty("slug").GetString())];

    // L2-128 #6
    [Fact]
    public async Task A_change_that_fails_to_save_keeps_the_cached_list()
    {
        using var factory = new ApiFactory();
        var before = await Body(factory, "/api/events");
        await factory.WithDbAsync(db => db.Events.Where(e => e.Slug == "bedrock-in-the-real-world")
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.Title, "Renamed unnoticed")));

        await Assert.ThrowsAnyAsync<DbUpdateException>(() => factory.WithDbAsync(async db =>
        {
            (await db.Events.SingleAsync(e => e.Slug == "signals-all-the-way-down")).Slug = "bedrock-in-the-real-world";
            return await db.SaveChangesAsync();
        }));

        Assert.Equal(before, await Body(factory, "/api/events"));
    }

    // L2-126 #4
    [Fact]
    public async Task A_tag_from_before_a_change_gets_the_new_listing()
    {
        using var factory = new ApiFactory();
        var client = factory.CreateHttpsClient();
        var old = (await client.GetAsync("/api/events")).Headers.ETag!.Tag;
        await factory.WithDbAsync(async db =>
        {
            (await db.Events.SingleAsync(e => e.Slug == "bedrock-in-the-real-world")).Title = "Bedrock, a year on";
            return await db.SaveChangesAsync();
        });

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/events");
        request.Headers.TryAddWithoutValidation("If-None-Match", old);
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotEqual(old, response.Headers.ETag!.Tag);
        Assert.Contains("Bedrock, a year on", await response.Content.ReadAsStringAsync());
    }
}
