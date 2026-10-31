using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Directory;

/// <summary>L2-032: GET /api/speakers, with "now" Monday, November 2, 2026.</summary>
public sealed class SpeakersTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const int Listed = 14;

    private async Task<JsonElement> Get(string query = "")
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/speakers{query}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static List<JsonElement> Items(JsonElement d) => [.. d.GetProperty("items").EnumerateArray()];

    private static List<string?> Names(JsonElement d) => [.. Items(d).Select(i => i.GetProperty("name").GetString())];

    [Fact]
    public async Task The_first_page_holds_nine_cards_by_next_talk()
    {
        var d = await Get();

        Assert.Equal((Listed, Listed, 9, true),
            (d.GetProperty("listedTotal").GetInt32(), d.GetProperty("matchCount").GetInt32(), Items(d).Count, d.GetProperty("hasMore").GetBoolean()));
        var priya = Items(d).Single(i => i.GetProperty("slug").GetString() == "priya-natarajan");
        Assert.Equal(("Priya Natarajan", "PN", "Azure MVP · Cloud architect, Rogers"),
            (priya.GetProperty("name").GetString(), priya.GetProperty("initials").GetString(), priya.GetProperty("role").GetString()));
        Assert.Equal(["ai", "azure"], priya.GetProperty("topics").EnumerateArray().Select(t => t.GetString()));
        var talk = priya.GetProperty("nextTalk");
        Assert.Equal(("Keynote: Fabric one year later", "Thu, Nov 5", "azure-data-ai-day-gta"),
            (talk.GetProperty("title").GetString(), talk.GetProperty("dateLabel").GetString(), talk.GetProperty("eventSlug").GetString()));
        Assert.Equal(Listed - 9, Items(await Get("?page=2")).Count);
    }

    [Fact]
    public async Task Speakers_with_no_upcoming_talk_come_last_without_a_next_line()
    {
        var all = Items(await Get("?page=2"));

        Assert.Contains(all, i => i.GetProperty("name").GetString() == "Hannah Wright" && i.GetProperty("nextTalk").ValueKind == JsonValueKind.Null);
    }

    [Fact]
    public async Task Search_matches_name_company_and_talk()
    {
        Assert.Equal(["Priya Natarajan"], Names(await Get("?q=priya")));
        Assert.Contains("Kenji Watanabe", Names(await Get("?q=shopify")));
        Assert.Equal(["Nadia Chen"], Names(await Get("?q=RAG evaluation")));
        Assert.Equal(0, (await Get("?q=Kotlin")).GetProperty("matchCount").GetInt32());
    }

    [Fact]
    public async Task Topic_and_period_filter()
    {
        Assert.All(Items(await Get("?topic=react")), i => Assert.Contains("react", i.GetProperty("topics").EnumerateArray().Select(t => t.GetString())));
        var month = Names(await Get("?period=month"));
        Assert.Contains("Priya Natarajan", month);
        Assert.DoesNotContain("Hannah Wright", month);
        var year = Names(await Get("?period=year"));
        Assert.Contains("Hannah Wright", year);
        Assert.DoesNotContain("Priya Natarajan", year);
        Assert.Equal(0, (await Get("?topic=aws&period=month&q=nobody")).GetProperty("matchCount").GetInt32());
    }

    [Fact]
    public async Task Unknown_topic_or_period_is_refused()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await factory.CreateHttpsClient().GetAsync("/api/speakers?topic=cobol")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await factory.CreateHttpsClient().GetAsync("/api/speakers?period=decade")).StatusCode);
    }
}
