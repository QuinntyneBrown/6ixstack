using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-025 and L2-027: GET /api/events/calendar for one Toronto month, with "today" November 2, 2026.</summary>
public sealed class MonthCalendarTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<JsonElement> Get(string query) =>
        await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>($"/api/events/calendar{query}");

    private static string[] Titles(JsonElement month) =>
        [.. month.GetProperty("days").EnumerateArray().SelectMany(d => d.GetProperty("events").EnumerateArray()).Select(e => e.GetProperty("title").GetString()!)];

    [Fact]
    public async Task November_has_its_totals_and_its_days_in_start_order()
    {
        var month = await Get("?month=2026-11");

        Assert.Equal("November 2026", month.GetProperty("monthLabel").GetString());
        var totals = month.GetProperty("totals");
        Assert.Equal((20, 15, 7), (totals.GetProperty("events").GetInt32(), totals.GetProperty("gta").GetInt32(), totals.GetProperty("streaming").GetInt32()));
        var fourth = month.GetProperty("days").EnumerateArray().Single(d => d.GetProperty("date").GetString() == "2026-11-04");
        Assert.Equal(
            ["Azure AI Foundry: shipping agents to production", "Signals all the way down"],
            fourth.GetProperty("events").EnumerateArray().Select(e => e.GetProperty("title").GetString()));
        var first = fourth.GetProperty("events")[0];
        Assert.Equal("azure-ai-foundry-shipping-agents", first.GetProperty("slug").GetString());
        Assert.Equal("ai", first.GetProperty("firstTopic").GetString());
        Assert.Equal("12:00 PM", first.GetProperty("startTimeEt").GetString());
    }

    [Fact]
    public async Task Cancelled_and_unpublished_events_are_left_out()
    {
        var titles = Titles(await Get("?month=2026-11"));

        Assert.DoesNotContain("Brampton Dev Night: November social", titles);
        Assert.DoesNotContain("Fabric for Power BI developers", titles);
        Assert.Equal(20, titles.Length);
    }

    [Fact]
    public async Task Filters_narrow_the_days_and_the_counts_follow_the_topics()
    {
        var month = await Get("?month=2026-11&format=gta&topics=react");

        Assert.Equal(["Server Components, one year in", "Testing React in 2027"], Titles(month));
        Assert.Equal(2, month.GetProperty("matchCount").GetInt32());
        var counts = month.GetProperty("counts");
        Assert.Equal((3, 2, 1), (counts.GetProperty("all").GetInt32(), counts.GetProperty("gta").GetInt32(), counts.GetProperty("streaming").GetInt32()));
        Assert.Equal(20, month.GetProperty("totals").GetProperty("events").GetInt32());
    }

    [Fact]
    public async Task An_empty_month_has_zero_totals()
    {
        var month = await Get("?month=2026-12");

        Assert.Equal("December 2026", month.GetProperty("monthLabel").GetString());
        Assert.Equal(0, month.GetProperty("totals").GetProperty("events").GetInt32());
        Assert.Empty(month.GetProperty("days").EnumerateArray());
    }

    [Theory]
    [InlineData("?month=2026-13")]
    [InlineData("?month=november")]
    [InlineData("?month=1999-12")]
    public async Task A_malformed_or_out_of_range_month_is_a_bad_request(string query)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/events/calendar{query}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
