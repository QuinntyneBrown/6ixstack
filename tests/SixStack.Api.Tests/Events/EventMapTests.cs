using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-011 and L2-013: GET /api/events/map, with "now" Monday, November 2, 2026.</summary>
public sealed class EventMapTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<JsonElement> Map(string query = "")
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/events/map{query}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task The_default_map_has_nine_venue_dots_two_hybrid_and_five_stream_arcs()
    {
        var map = await Map();

        var points = map.GetProperty("points").EnumerateArray().ToList();
        Assert.Equal(9, points.Count);
        Assert.Equal(2, points.Count(p => p.GetProperty("isHybrid").GetBoolean()));
        Assert.Equal(5, map.GetProperty("streams").GetArrayLength());
        var day = points.Single(p => p.GetProperty("slug").GetString() == "azure-data-ai-day-gta");
        Assert.Equal(("ai", "Thu Nov 5 · 9:00 AM", "2026-11-05", true),
            (day.GetProperty("firstTopic").GetString(), day.GetProperty("cardMeta").GetString(), day.GetProperty("date").GetString(), day.GetProperty("isHybrid").GetBoolean()));
        Assert.Equal(43.5912, day.GetProperty("latitude").GetDouble(), 3);
        var reactor = map.GetProperty("streams").EnumerateArray().Single(s => s.GetProperty("slug").GetString() == "azure-ai-foundry-shipping-agents");
        Assert.Equal(("Redmond", "west", "9:00 AM PT"),
            (reactor.GetProperty("originCity").GetString(), reactor.GetProperty("originSide").GetString(), reactor.GetProperty("sourceTime").GetString()));
        var london = map.GetProperty("streams").EnumerateArray().Single(s => s.GetProperty("slug").GetString() == "dotnet-aspire-deep-dive");
        Assert.Equal(("London", "east"), (london.GetProperty("originCity").GetString(), london.GetProperty("originSide").GetString()));
    }

    [Fact]
    public async Task The_timeline_has_fourteen_days_with_counts_and_topic_dots()
    {
        var map = await Map();

        var days = map.GetProperty("days").EnumerateArray().ToList();
        Assert.Equal(14, days.Count);
        Assert.Equal(("2026-11-02", "M", 2), (days[0].GetProperty("date").GetString(), days[0].GetProperty("weekdayLetter").GetString(), days[0].GetProperty("dayOfMonth").GetInt32()));
        var nov5 = days.Single(d => d.GetProperty("date").GetString() == "2026-11-05");
        Assert.Equal("Thursday, November 5", nov5.GetProperty("label").GetString());
        Assert.True(nov5.GetProperty("count").GetInt32() > 0);
        Assert.InRange(nov5.GetProperty("dots").GetArrayLength(), 1, 4);
        Assert.Contains(days, d => d.GetProperty("count").GetInt32() == 0);
    }

    [Fact]
    public async Task The_map_follows_the_topic_filter()
    {
        var map = await Map("?topics=ai");

        var all = map.GetProperty("points").EnumerateArray().Concat(map.GetProperty("streams").EnumerateArray()).ToList();
        Assert.NotEmpty(all);
        Assert.All(all, e => Assert.Contains("ai", e.GetProperty("topics").EnumerateArray().Select(t => t.GetString())));
    }

    [Fact]
    public async Task A_venue_without_coordinates_is_left_off_the_map()
    {
        using var own = new ApiFactory();
        await own.WithDbAsync(async db =>
        {
            var e = await db.Events.SingleAsync(x => x.Slug == "azure-data-ai-day-gta");
            e.Venue!.Latitude = null;
            e.Venue.Longitude = null;
            await db.SaveChangesAsync();
            return 0;
        });

        var map = await (await own.CreateHttpsClient().GetAsync("/api/events/map")).Content.ReadFromJsonAsync<JsonElement>();

        Assert.DoesNotContain(map.GetProperty("points").EnumerateArray(), p => p.GetProperty("slug").GetString() == "azure-data-ai-day-gta");
        Assert.Equal(8, map.GetProperty("points").GetArrayLength());
    }

    [Fact]
    public async Task An_unknown_format_is_refused()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/events/map?format=moon");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
