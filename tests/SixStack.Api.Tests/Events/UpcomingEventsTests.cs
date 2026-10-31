using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-001 to L2-004, L2-007, L2-009: GET /api/events, with "today" Monday, November 2, 2026.</summary>
public sealed class UpcomingEventsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<JsonElement> Get(string query = "")
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/events{query}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static List<JsonElement> Events(JsonElement page) =>
        [.. page.GetProperty("days").EnumerateArray().SelectMany(d => d.GetProperty("events").EnumerateArray())];

    private static List<string> Titles(JsonElement page) => [.. Events(page).Select(e => e.GetProperty("title").GetString()!)];

    [Fact]
    public async Task Lists_the_upcoming_window_grouped_by_toronto_day_in_start_order()
    {
        var page = await Get();

        var days = page.GetProperty("days").EnumerateArray().ToList();
        Assert.Equal(14, Events(page).Count);
        Assert.Equal(["2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"],
            days.Select(d => d.GetProperty("date").GetString()));
        Assert.Equal("Tuesday", days[0].GetProperty("weekday").GetString());
        Assert.Equal("November 3", days[0].GetProperty("dateLabel").GetString());
        Assert.Equal(["Azure AI Foundry: shipping agents to production", "Signals all the way down"],
            days[1].GetProperty("events").EnumerateArray().Select(e => e.GetProperty("title").GetString()));
    }

    [Fact]
    public async Task Rows_carry_display_labels()
    {
        var events = Events(await Get());
        JsonElement Row(string slug) => events.Single(e => e.GetProperty("slug").GetString() == slug);

        var dotnet = Row("whats-new-in-dotnet-11-previews");
        Assert.Equal("6:00 PM", dotnet.GetProperty("startTimeEt").GetString());
        Assert.Equal("Toronto .NET User Group", dotnet.GetProperty("organizer").GetString());
        Assert.Equal("Microsoft Canada, Toronto", dotnet.GetProperty("locationLabel").GetString());
        Assert.Equal("Free", dotnet.GetProperty("priceLabel").GetString());
        Assert.Equal(142, dotnet.GetProperty("goingCount").GetInt32());
        Assert.Equal(["dotnet"], dotnet.GetProperty("topics").EnumerateArray().Select(t => t.GetString()));

        var stream = Row("azure-ai-foundry-shipping-agents");
        Assert.Equal("streaming", stream.GetProperty("format").GetString());
        Assert.Equal("Streaming online", stream.GetProperty("locationLabel").GetString());
        Assert.Equal("9:00 AM PT", stream.GetProperty("sourceTime").GetString());

        var hybrid = Row("azure-data-ai-day-gta");
        Assert.Equal("hybrid", hybrid.GetProperty("format").GetString());
        Assert.Equal("Living Arts Centre, Mississauga", hybrid.GetProperty("locationLabel").GetString());
        Assert.Equal("$49", hybrid.GetProperty("priceLabel").GetString());
        Assert.Equal(JsonValueKind.Null, hybrid.GetProperty("sourceTime").ValueKind);

        Assert.Equal("4:00 PM GMT", Row("dotnet-aspire-deep-dive").GetProperty("sourceTime").GetString());
        Assert.Equal("11:00 AM MT", Row("angular-roadmap-live-qa").GetProperty("sourceTime").GetString());
        Assert.Equal("5:00 PM CET", Row("react-summit-remote-performance-track").GetProperty("sourceTime").GetString());
    }

    [Fact]
    public async Task Hero_and_format_counts_cover_the_window_with_hybrid_in_both()
    {
        var page = await Get();

        Assert.Equal(9, page.GetProperty("heroCounts").GetProperty("gta").GetInt32());
        Assert.Equal(7, page.GetProperty("heroCounts").GetProperty("streamable").GetInt32());
        var counts = page.GetProperty("formatCounts");
        Assert.Equal((14, 9, 7), (counts.GetProperty("all").GetInt32(), counts.GetProperty("gta").GetInt32(), counts.GetProperty("streaming").GetInt32()));
    }

    [Fact]
    public async Task Format_filter_keeps_the_counts_and_narrows_the_list()
    {
        var gta = await Get("?format=gta");
        var streaming = await Get("?format=streaming");

        Assert.Equal(9, Events(gta).Count);
        Assert.All(Events(gta), e => Assert.Contains(e.GetProperty("format").GetString(), new[] { "inPerson", "hybrid" }));
        Assert.Equal(7, Events(streaming).Count);
        Assert.Equal(14, gta.GetProperty("formatCounts").GetProperty("all").GetInt32());
    }

    [Fact]
    public async Task Topic_filter_matches_any_selected_topic_and_updates_counts()
    {
        var ai = await Get("?topics=ai");
        var aiOrReact = await Get("?topics=ai&topics=react");

        Assert.Equal(6, Events(ai).Count);
        var counts = ai.GetProperty("formatCounts");
        Assert.Equal((6, 4, 3), (counts.GetProperty("all").GetInt32(), counts.GetProperty("gta").GetInt32(), counts.GetProperty("streaming").GetInt32()));
        Assert.Equal(9, aiOrReact.GetProperty("heroCounts").GetProperty("gta").GetInt32());
        Assert.Equal(8, Events(aiOrReact).Count);
    }

    [Theory]
    [InlineData("signals", "Signals all the way down")]
    [InlineData("MARKHAM", "GTA AI Builders Hackathon")]
    [InlineData("pizza", "What's new in the .NET 11 previews")]
    [InlineData("women in ai", "RAG evaluation workshop")]
    [InlineData("vector institute", "RAG evaluation workshop")]
    public async Task Search_matches_title_organizer_venue_city_and_description_case_insensitively(string q, string title)
    {
        var page = await Get($"?q={Uri.EscapeDataString(q)}");

        Assert.Contains(title, Titles(page));
    }

    [Fact]
    public async Task Search_combines_with_format_and_can_match_nothing()
    {
        var page = await Get("?q=Kubernetes&format=gta");

        Assert.Empty(Events(page));
        Assert.Equal(0, page.GetProperty("formatCounts").GetProperty("all").GetInt32());
        Assert.Equal(9, page.GetProperty("heroCounts").GetProperty("gta").GetInt32());
    }

    [Fact]
    public async Task Long_search_is_truncated_to_100_characters()
    {
        var page = await Get($"?q={new string('a', 150)}");

        Assert.Equal(100, page.GetProperty("search").GetString()!.Length);
    }

    [Theory]
    [InlineData("?format=moon")]
    [InlineData("?topics=cobol")]
    [InlineData("?page=0")]
    public async Task Unknown_values_are_rejected_with_400(string query)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/events{query}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task First_page_states_how_many_are_shown_of_all_upcoming_and_the_next_page_continues()
    {
        var first = await Get();
        var second = await Get("?page=2");

        Assert.Equal(14, first.GetProperty("shown").GetInt32());
        Assert.Equal(19, first.GetProperty("total").GetInt32());
        Assert.Equal("November 26", first.GetProperty("throughLabel").GetString());
        Assert.True(first.GetProperty("hasMore").GetBoolean());
        Assert.Equal(["Vector search in Postgres", "Minimal APIs in practice", "Angular Toronto: lightning talks", "re:Invent keynote watch party", "Testing React in 2027"],
            Titles(second));
        Assert.Equal(19, second.GetProperty("shown").GetInt32());
        Assert.False(second.GetProperty("hasMore").GetBoolean());
    }

    [Fact]
    public async Task Anonymous_visitors_can_read_events()
    {
        var response = await factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") }).GetAsync("/api/events");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
