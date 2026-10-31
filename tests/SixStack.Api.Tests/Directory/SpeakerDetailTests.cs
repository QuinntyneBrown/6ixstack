using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Directory;

/// <summary>L2-033: GET /api/speakers/{slug}, with "now" Monday, November 2, 2026.</summary>
public sealed class SpeakerDetailTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<JsonElement> Get(string slug)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/speakers/{slug}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task Priyas_page_has_her_profile_talks_and_facts()
    {
        var s = await Get("priya-natarajan");

        Assert.Equal(("Priya Natarajan", "PN", "Azure MVP · Cloud architect, Rogers"),
            (s.GetProperty("name").GetString(), s.GetProperty("initials").GetString(), s.GetProperty("role").GetString()));
        var org = s.GetProperty("community");
        Assert.Equal(("Lead organizer", "GTA Azure Community", "gta-azure-community"),
            (org.GetProperty("roleLabel").GetString(), org.GetProperty("name").GetString(), org.GetProperty("slug").GetString()));
        Assert.Equal(2, s.GetProperty("bio").GetArrayLength());
        var upcoming = s.GetProperty("upcoming").EnumerateArray().Single();
        Assert.Equal(("Keynote: Fabric one year later", "9:30 AM", "2026-11-05", "azure-data-ai-day-gta"),
            (upcoming.GetProperty("title").GetString(), upcoming.GetProperty("startTimeEt").GetString(), upcoming.GetProperty("date").GetString(), upcoming.GetProperty("slug").GetString()));
        Assert.Equal("Azure Data & AI Day GTA · GTA Azure Community", upcoming.GetProperty("organizer").GetString());
        var past = s.GetProperty("past").EnumerateArray().Single();
        Assert.Equal(("Bicep modules that scale", "GTA Azure Community · Oct 19, 2026"),
            (past.GetProperty("title").GetString(), past.GetProperty("meta").GetString()));
        Assert.StartsWith("https://", past.GetProperty("recordingUrl").GetString());
        var facts = s.GetProperty("facts");
        Assert.Equal(("43 talks", "Since 2019", "Mississauga", "Speaks in person across the GTA"),
            (facts.GetProperty("talkCountLabel").GetString(), facts.GetProperty("sinceLabel").GetString(),
             facts.GetProperty("homeCity").GetString(), facts.GetProperty("homeCityNote").GetString()));
        Assert.Equal(["priya.dev", "LinkedIn", "GitHub"], facts.GetProperty("links").EnumerateArray().Select(l => l.GetProperty("label").GetString()));
        Assert.Equal("mailto:priya@gtaazure.ca", s.GetProperty("inviteUrl").GetString());
    }

    [Fact]
    public async Task A_speaker_with_only_past_talks_and_no_contact_has_no_invite()
    {
        var s = await Get("hannah-wright");

        Assert.Empty(s.GetProperty("upcoming").EnumerateArray());
        Assert.Equal("Flex Consumption in production", s.GetProperty("past")[0].GetProperty("title").GetString());
        Assert.Equal(JsonValueKind.Null, s.GetProperty("inviteUrl").ValueKind);
        Assert.Equal(JsonValueKind.Null, s.GetProperty("community").ValueKind);
        Assert.Equal("1 talk", s.GetProperty("facts").GetProperty("talkCountLabel").GetString());
    }

    [Fact]
    public async Task An_unknown_speaker_is_not_found()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateHttpsClient().GetAsync("/api/speakers/nobody")).StatusCode);
    }
}
