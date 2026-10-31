using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Directory;

/// <summary>L2-031: GET /api/communities/{slug}, with "now" Monday, November 2, 2026.</summary>
public sealed class CommunityDetailTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<JsonElement> Get(string slug)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/communities/{slug}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task The_page_has_the_header_upcoming_events_by_day_and_three_past_events()
    {
        var c = await Get("gta-azure-community");

        Assert.Equal(("GTA Azure Community", "GA", "Azure, data and AI in Mississauga and Peel, run by local MVPs."),
            (c.GetProperty("name").GetString(), c.GetProperty("initials").GetString(), c.GetProperty("tagline").GetString()));
        Assert.Equal(["ai", "azure"], c.GetProperty("topics").EnumerateArray().Select(t => t.GetString()));
        Assert.Equal(2, c.GetProperty("about").GetArrayLength());
        var upcoming = c.GetProperty("upcoming").EnumerateArray().SelectMany(d => d.GetProperty("events").EnumerateArray())
            .Select(e => e.GetProperty("title").GetString()).ToList();
        Assert.Equal(["Azure Data & AI Day GTA"], upcoming);
        var past = c.GetProperty("past").EnumerateArray().ToList();
        Assert.Equal(3, past.Count);
        Assert.Equal(("Copilot Studio for developers", "Oct 29, 2026"), (past[0].GetProperty("title").GetString(), past[0].GetProperty("dateLabel").GetString()));
        Assert.True(past[0].GetProperty("attendedCount").GetInt32() > 0);
    }

    [Fact]
    public async Task The_facts_and_organizers_link_out_without_emails()
    {
        var c = await Get("gta-azure-community");

        var facts = c.GetProperty("facts");
        Assert.Equal(("2,140 members", "Monthly since 2019", "Mississauga and online", "Living Arts Centre, Sheridan College", "gtaazure.ca"),
            (facts.GetProperty("audienceLabel").GetString(), facts.GetProperty("cadenceLabel").GetString(), facts.GetProperty("placesLabel").GetString(),
             facts.GetProperty("placesDetail").GetString(), facts.GetProperty("websiteLabel").GetString()));
        Assert.Equal(["Website", "Meetup", "LinkedIn"], facts.GetProperty("links").EnumerateArray().Select(l => l.GetProperty("label").GetString()));
        var organizers = c.GetProperty("organizers").EnumerateArray().ToList();
        Assert.Equal(("Priya Natarajan", "Lead organizer", "priya-natarajan"),
            (organizers[0].GetProperty("name").GetString(), organizers[0].GetProperty("roleLabel").GetString(), organizers[0].GetProperty("speakerSlug").GetString()));
        Assert.DoesNotContain("@", c.GetRawText());
    }

    [Fact]
    public async Task A_group_with_nothing_scheduled_says_when_it_usually_posts()
    {
        using var own = new ApiFactory();
        await own.WithDbAsync(async db =>
        {
            foreach (var e in await db.Events.Where(x => x.Community!.Slug == "gta-azure-community" && x.StartsAtUtc > ApiFactory.Today).ToListAsync())
            {
                e.Status = Domain.Enums.EventStatus.InReview;
            }

            await db.SaveChangesAsync();
            return 0;
        });

        var c = await (await own.CreateHttpsClient().GetAsync("/api/communities/gta-azure-community")).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Empty(c.GetProperty("upcoming").EnumerateArray());
        Assert.Equal("GTA Azure Community usually posts its next meetup about three weeks ahead.",
            c.GetProperty("facts").GetProperty("postingLeadLabel").GetString());
    }

    [Fact]
    public async Task An_unknown_community_is_not_found()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateHttpsClient().GetAsync("/api/communities/nobody")).StatusCode);
    }
}
