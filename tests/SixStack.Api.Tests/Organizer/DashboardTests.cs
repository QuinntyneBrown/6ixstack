using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Identity;
using SixStack.Api.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Moderation;

namespace SixStack.Api.Tests.Organizer;

/// <summary>L2-051 and L2-053: GET /api/organizer/events for the signed-in organizer.</summary>
public sealed class DashboardTests
{
    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static async Task<JsonElement> Dashboard(HttpClient client) =>
        await client.GetFromJsonAsync<JsonElement>("/api/organizer/events");

    private static JsonElement Row(JsonElement dashboard, string title) =>
        dashboard.GetProperty("rows").EnumerateArray().Single(r => r.GetProperty("title").GetString() == title);

    [Fact]
    public async Task Priyas_dashboard_has_her_communitys_stats_and_events()
    {
        using var factory = new ApiFactory();

        var dashboard = await Dashboard(await As(factory, HttpClientExtensions.Organizer));

        Assert.Equal("GTA Azure Community", dashboard.GetProperty("communityName").GetString());
        Assert.Equal(HttpClientExtensions.Organizer, dashboard.GetProperty("email").GetString());
        var stats = dashboard.GetProperty("stats");
        Assert.Equal((1, 1, 318, 1204), (stats.GetProperty("upcoming").GetInt32(), stats.GetProperty("inReview").GetInt32(), stats.GetProperty("going").GetInt32(), stats.GetProperty("feedSubscribers").GetInt32()));
        var day = Row(dashboard, "Azure Data & AI Day GTA");
        Assert.Equal(("published", "Published", "Thu, Nov 5 · 9:00 AM", 318, "/events/azure-data-ai-day-gta"),
            (day.GetProperty("status").GetString(), day.GetProperty("statusLabel").GetString(), day.GetProperty("dateLabel").GetString(), day.GetProperty("going").GetInt32(), day.GetProperty("publicUrl").GetString()));
        Assert.Equal("In review", Row(dashboard, "Fabric for Power BI developers").GetProperty("statusLabel").GetString());
        var bicep = Row(dashboard, "Azure Bicep clinic");
        Assert.Equal(("Needs changes", "Add the venue address"), (bicep.GetProperty("statusLabel").GetString(), bicep.GetProperty("needsChangesReason").GetString()));
        var past = Row(dashboard, "Copilot Studio for developers");
        Assert.Equal("Past", past.GetProperty("statusLabel").GetString());
        Assert.Equal(JsonValueKind.Null, Row(dashboard, "Fabric for Power BI developers").GetProperty("publicUrl").ValueKind);
    }

    [Fact]
    public async Task Rows_are_in_date_order_and_other_communities_never_appear()
    {
        using var factory = new ApiFactory();

        var dashboard = await Dashboard(await As(factory, HttpClientExtensions.Organizer));

        var titles = dashboard.GetProperty("rows").EnumerateArray().Select(r => r.GetProperty("title").GetString()).ToList();
        Assert.DoesNotContain("Vector search in Postgres", titles);
        Assert.DoesNotContain("Kubernetes on a budget", titles);
        var dates = dashboard.GetProperty("rows").EnumerateArray().Select(r => r.GetProperty("startsAtUtc").GetDateTimeOffset()).ToList();
        Assert.Equal(dates.OrderBy(d => d), dates);
    }

    [Fact]
    public async Task The_banner_shows_the_newest_outcome_in_review_then_live()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var before = (await Dashboard(priya)).GetProperty("banner");
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var fabric = await factory.WithDbAsync(db => db.Events.Where(e => e.Slug == "fabric-for-power-bi-developers").Select(e => e.Id).SingleAsync());
        await jordan.PostAsync($"/api/moderation/submissions/{fabric}/approve", null);
        var after = (await Dashboard(priya)).GetProperty("banner");

        Assert.Equal(("inReview", "“Fabric for Power BI developers” is in review", "Moderators usually reply within a day. We’ll email you either way."),
            (before.GetProperty("kind").GetString(), before.GetProperty("title").GetString(), before.GetProperty("text").GetString()));
        Assert.Equal(("live", "“Fabric for Power BI developers” is live", "fabric-for-power-bi-developers"),
            (after.GetProperty("kind").GetString(), after.GetProperty("title").GetString(), after.GetProperty("eventSlug").GetString()));
        Assert.NotEqual(before.GetProperty("key").GetString(), after.GetProperty("key").GetString());
    }

    [Fact]
    public async Task A_rejection_quotes_the_moderator_by_first_name()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var fabric = await factory.WithDbAsync(db => db.Events.Where(e => e.Slug == "fabric-for-power-bi-developers").Select(e => e.Id).SingleAsync());
        await jordan.PostAsJsonAsync($"/api/moderation/submissions/{fabric}/reject", new { reason = "notDeveloperEvent", message = "This reads like a product launch." });

        var dashboard = await Dashboard(priya);

        var banner = dashboard.GetProperty("banner");
        Assert.Equal("notApproved", banner.GetProperty("kind").GetString());
        Assert.Equal("“Fabric for Power BI developers” wasn’t approved", banner.GetProperty("title").GetString());
        Assert.Equal("“This reads like a product launch.” — Jordan, 6ixstack moderator", banner.GetProperty("text").GetString());
        Assert.Equal("Not approved", Row(dashboard, "Fabric for Power BI developers").GetProperty("statusLabel").GetString());
    }

    [Fact]
    public async Task A_new_organizer_has_no_events_and_a_verify_banner_until_verified()
    {
        using var factory = new ApiFactory();
        var email = $"first-{Guid.NewGuid():N}@example.com";
        await factory.RequestLink(email);
        var client = factory.CreateHttpsClient();
        await client.RedeemAsync(await factory.LatestToken(email));

        var dashboard = await Dashboard(client);
        var resend = await client.PostAsync("/api/organizer/verification-email", null);
        await factory.RunOutboxAsync();

        Assert.Empty(dashboard.GetProperty("rows").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, dashboard.GetProperty("communityName").ValueKind);
        var banner = dashboard.GetProperty("banner");
        Assert.Equal(("unverified", $"Verify {email} to publish events", false),
            (banner.GetProperty("kind").GetString(), banner.GetProperty("title").GetString(), banner.GetProperty("dismissible").GetBoolean()));
        Assert.Equal(HttpStatusCode.Accepted, resend.StatusCode);
        Assert.Contains(factory.Services.GetRequiredService<SixStack.Infrastructure.Email.DevMailbox>().For(email),
            m => m.Message.Subject == "Verify your email to publish events");
    }

    [Fact]
    public async Task Only_organizers_open_the_dashboard()
    {
        using var factory = new ApiFactory();

        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/organizer/events")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await (await As(factory, HttpClientExtensions.Moderator)).GetAsync("/api/organizer/events")).StatusCode);
    }
}
