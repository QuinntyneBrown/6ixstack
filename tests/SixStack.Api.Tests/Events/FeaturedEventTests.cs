using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-006: GET /api/events/featured, with "now" Monday, November 2, 2026.</summary>
public sealed class FeaturedEventTests
{
    private static async Task<HttpResponseMessage> Featured(ApiFactory factory) =>
        await factory.CreateHttpsClient().GetAsync("/api/events/featured");

    [Fact]
    public async Task This_weeks_featured_event_comes_with_its_card_labels()
    {
        using var factory = new ApiFactory();

        var response = await Featured(factory);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var e = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(("azure-data-ai-day-gta", "Azure Data & AI Day GTA", "GTA Azure Community", "Nov", "5"),
            (e.GetProperty("slug").GetString(), e.GetProperty("title").GetString(), e.GetProperty("organizer").GetString(),
             e.GetProperty("monthLabel").GetString(), e.GetProperty("dayOfMonth").GetString()));
        Assert.Equal(("Living Arts Centre, Mississauga", true, "Thu · 9:00 AM"),
            (e.GetProperty("locationLabel").GetString(), e.GetProperty("hasLivestream").GetBoolean(), e.GetProperty("whenLabel").GetString()));
        var action = e.GetProperty("primaryAction");
        Assert.Equal(("Get tickets · $49", "/events/azure-data-ai-day-gta"), (action.GetProperty("label").GetString(), action.GetProperty("url").GetString()));
    }

    [Fact]
    public async Task Featuring_another_event_replaces_the_first()
    {
        using var factory = new ApiFactory();
        await factory.WithDbAsync(async db =>
        {
            foreach (var e in await db.Events.Where(x => x.IsFeatured).ToListAsync())
            {
                e.IsFeatured = false;
            }

            (await db.Events.SingleAsync(x => x.Slug == "whats-new-in-dotnet-11-previews")).IsFeatured = true;
            await db.SaveChangesAsync();
            return 0;
        });

        var e = await (await Featured(factory)).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("whats-new-in-dotnet-11-previews", e.GetProperty("slug").GetString());
        Assert.Equal("See the event", e.GetProperty("primaryAction").GetProperty("label").GetString());
    }

    [Fact]
    public async Task A_cancelled_featured_event_is_no_longer_featured()
    {
        using var factory = new ApiFactory();
        await factory.WithDbAsync(async db =>
        {
            (await db.Events.SingleAsync(x => x.Slug == "azure-data-ai-day-gta")).CancelledAtUtc = ApiFactory.Today;
            await db.SaveChangesAsync();
            return 0;
        });

        Assert.Equal(HttpStatusCode.NoContent, (await Featured(factory)).StatusCode);
    }

    [Fact]
    public async Task A_featured_event_in_another_week_is_not_this_weeks()
    {
        using var factory = new ApiFactory();
        await factory.WithDbAsync(async db =>
        {
            foreach (var e in await db.Events.Where(x => x.IsFeatured).ToListAsync())
            {
                e.IsFeatured = false;
            }

            (await db.Events.SingleAsync(x => x.Slug == "landing-zones-that-dont-hurt")).IsFeatured = true;
            await db.SaveChangesAsync();
            return 0;
        });

        Assert.Equal(HttpStatusCode.NoContent, (await Featured(factory)).StatusCode);
    }
}
