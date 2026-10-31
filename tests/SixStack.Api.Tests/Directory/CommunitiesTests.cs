using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Directory;

/// <summary>L2-029 and L2-030: GET /api/communities, with "now" Monday, November 2, 2026.</summary>
public sealed class CommunitiesTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    /// <summary>Communities with at least one published event: the seed's 17 less WealthFast Academy and Toronto Rust.</summary>
    private const int Listed = 15;

    private async Task<JsonElement> Get(string query = "")
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/communities{query}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static List<JsonElement> Items(JsonElement d) => [.. d.GetProperty("items").EnumerateArray()];

    [Fact]
    public async Task The_first_page_holds_ten_cards_by_most_members()
    {
        var d = await Get();

        var items = Items(d);
        Assert.Equal(10, items.Count);
        Assert.Equal((Listed, Listed), (d.GetProperty("listedTotal").GetInt32(), d.GetProperty("matchCount").GetInt32()));
        Assert.Equal("Microsoft Reactor", items[0].GetProperty("name").GetString());
        var members = items.Select(i => i.GetProperty("memberCount").GetInt32()).ToList();
        Assert.Equal(members.OrderByDescending(m => m), members);
        var gta = Items(await Get("?city=Mississauga")).Single();
        Assert.Equal(("GTA Azure Community", "GA", "Mississauga", "2,140 members"),
            (gta.GetProperty("name").GetString(), gta.GetProperty("initials").GetString(), gta.GetProperty("city").GetString(), gta.GetProperty("audienceLabel").GetString()));
        var next = gta.GetProperty("nextEvent");
        Assert.Equal(("azure-data-ai-day-gta", "Azure Data & AI Day GTA", "Thu, Nov 5"),
            (next.GetProperty("slug").GetString(), next.GetProperty("title").GetString(), next.GetProperty("dateLabel").GetString()));
        Assert.Equal(["ai", "azure"], gta.GetProperty("topics").EnumerateArray().Select(t => t.GetString()));
    }

    [Fact]
    public async Task Later_pages_hold_the_rest()
    {
        Assert.Equal(Listed - 10, Items(await Get("?page=2")).Count);
    }

    [Fact]
    public async Task A_streaming_community_counts_followers()
    {
        var reactor = Items(await Get("?city=Streaming")).Single(i => i.GetProperty("slug").GetString() == "microsoft-reactor");

        Assert.Equal("18,400 followers", reactor.GetProperty("audienceLabel").GetString());
    }

    [Fact]
    public async Task Search_matches_names_and_topics()
    {
        var byName = Items(await Get("?q=toronto"));
        var byTopic = Items(await Get("?q=angular"));

        Assert.NotEmpty(byName);
        Assert.All(byName, i => Assert.Contains("toronto", i.GetProperty("name").GetString()!, StringComparison.OrdinalIgnoreCase));
        Assert.Contains(byTopic, i => i.GetProperty("name").GetString() == "Angular Toronto");
        Assert.Contains(byTopic, i => i.GetProperty("name").GetString() == "Brampton Dev Night");
        Assert.Equal(0, (await Get("?q=Rust")).GetProperty("matchCount").GetInt32());
    }

    [Fact]
    public async Task Sorts_by_next_event_and_by_name()
    {
        var soonest = Items(await Get("?sort=next"));
        var byName = Items(await Get("?sort=name"));

        Assert.Equal("Toronto .NET User Group", soonest[0].GetProperty("name").GetString());
        var names = byName.Select(i => i.GetProperty("name").GetString()).ToList();
        Assert.Equal(names.OrderBy(n => n, StringComparer.OrdinalIgnoreCase), names);
    }

    [Fact]
    public async Task Topic_and_city_filter_and_an_empty_city_has_no_matches()
    {
        Assert.All(Items(await Get("?topic=react")), i => Assert.Contains("react", i.GetProperty("topics").EnumerateArray().Select(t => t.GetString())));
        Assert.Equal(0, (await Get("?city=Oakville")).GetProperty("matchCount").GetInt32());
    }

    [Fact]
    public async Task Unknown_topic_or_sort_is_refused()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await factory.CreateHttpsClient().GetAsync("/api/communities?topic=cobol")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await factory.CreateHttpsClient().GetAsync("/api/communities?sort=random")).StatusCode);
    }
}
