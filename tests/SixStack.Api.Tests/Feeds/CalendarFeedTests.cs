using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.Feeds;

/// <summary>L2-034 ready-made feed counts and L2-036 feed content, with "today" November 2, 2026.</summary>
public sealed class CalendarFeedTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private Task<HttpResponseMessage> Feed(string slug, string? etag = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"/feeds/{slug}.ics");
        if (etag is not null)
        {
            request.Headers.IfNoneMatch.Add(EntityTagHeaderValue.Parse(etag));
        }

        return factory.CreateHttpsClient().SendAsync(request);
    }

    private static string Unfold(string body) => body.Replace("\r\n ", string.Empty, StringComparison.Ordinal);

    private static IEnumerable<string> Events(string body) =>
        Unfold(body).Split("BEGIN:VEVENT").Skip(1).Select(e => e[..e.IndexOf("END:VEVENT", StringComparison.Ordinal)]);

    private static string? Field(string vevent, string name) =>
        vevent.Split("\r\n").FirstOrDefault(l => l.StartsWith(name, StringComparison.Ordinal));

    [Fact]
    public async Task Ready_made_feeds_have_slugs_and_counts_for_the_next_two_weeks()
    {
        var feeds = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/feeds");

        var rows = feeds.GetProperty("feeds").EnumerateArray()
            .Select(f => (f.GetProperty("key").GetString(), f.GetProperty("feedSlug").GetString(), f.GetProperty("upcomingCount").GetInt32()))
            .ToList();
        Assert.Equal(
            [("everything", "all-gta-stream", 14), ("gta", "all-gta", 9), ("streaming", "all-stream", 7), ("ai", "ai-gta-stream", 6), ("dotnet", "dotnet-gta-stream", 4), ("azure", "azure-gta-stream", 4)],
            rows);
    }

    [Fact]
    public async Task A_feed_is_calendar_text_with_one_event_per_published_match()
    {
        var response = await Feed("ai-gta-stream");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/calendar", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("utf-8", response.Content.Headers.ContentType?.CharSet);
        Assert.Contains("X-WR-CALNAME:6ixstack: AI", Unfold(body));
        Assert.Contains("BEGIN:VTIMEZONE\r\nTZID:America/Toronto", body);
        var events = Events(body).ToList();
        Assert.Contains(events, e => Field(e, "SUMMARY") == "SUMMARY:Vector search in Postgres");
        Assert.DoesNotContain(events, e => Field(e, "SUMMARY") == "SUMMARY:Minimal APIs in practice");
        Assert.All(events, e => Assert.StartsWith("DTSTART;TZID=America/Toronto:", Field(e, "DTSTART")));
        Assert.All(events, e => Assert.Matches("^URL:https://6ixstack.dev/events/", Field(e, "URL")!));
    }

    [Fact]
    public async Task Events_in_review_or_rejected_never_appear()
    {
        var body = Unfold(await (await Feed("all-gta-stream")).Content.ReadAsStringAsync());

        Assert.DoesNotContain("Fabric for Power BI developers", body);
        Assert.DoesNotContain("Free crypto trading masterclass", body);
    }

    [Fact]
    public async Task A_cancelled_event_stays_with_status_cancelled()
    {
        var events = Events(await (await Feed("all-gta")).Content.ReadAsStringAsync());

        var brampton = Assert.Single(events, e => Field(e, "SUMMARY") == "SUMMARY:Brampton Dev Night: November social");
        Assert.Equal("STATUS:CANCELLED", Field(brampton, "STATUS"));
    }

    [Fact]
    public async Task The_window_starts_30_days_back()
    {
        using var old = new ApiFactory();
        await old.WithDbAsync(async db =>
        {
            var template = await db.Events.AsNoTracking().SingleAsync(e => e.Slug == "service-meshes-without-tears");
            db.Events.Add(new SixStack.Domain.Entities.Event
            {
                Slug = "long-ago-meetup",
                Title = "Long ago meetup",
                Description = "Too old for any feed.",
                CommunityId = template.CommunityId,
                Status = EventStatus.Published,
                Format = EventFormat.InPerson,
                Topics = template.Topics,
                StartsAtUtc = ApiFactory.Today.AddDays(-31).AddHours(-3),
                EndsAtUtc = ApiFactory.Today.AddDays(-31).AddHours(-1),
            });
            return await db.SaveChangesAsync();
        });

        var titles = Events(await (await new FeedReader(old).Get("all-gta-stream")).Content.ReadAsStringAsync()).Select(e => Field(e, "SUMMARY")).ToList();

        Assert.Contains("SUMMARY:Service meshes without tears", titles);
        Assert.DoesNotContain("SUMMARY:Long ago meetup", titles);
    }

    [Fact]
    public async Task A_changed_time_keeps_the_uid_with_a_higher_sequence()
    {
        using var changed = new ApiFactory();
        var before = Events(await (await new FeedReader(changed).Get("dotnet-gta-stream")).Content.ReadAsStringAsync())
            .Single(e => Field(e, "URL") == "URL:https://6ixstack.dev/events/minimal-apis-in-practice");
        await changed.WithDbAsync(async db =>
        {
            var e = await db.Events.SingleAsync(x => x.Slug == "minimal-apis-in-practice");
            e.StartsAtUtc = e.StartsAtUtc.AddHours(1);
            e.EndsAtUtc = e.EndsAtUtc.AddHours(1);
            e.Sequence++;
            return await db.SaveChangesAsync();
        });

        var after = Events(await (await new FeedReader(changed).Get("dotnet-gta-stream")).Content.ReadAsStringAsync())
            .Single(e => Field(e, "URL") == "URL:https://6ixstack.dev/events/minimal-apis-in-practice");

        Assert.Equal(Field(before, "UID"), Field(after, "UID"));
        Assert.Equal("SEQUENCE:0", Field(before, "SEQUENCE"));
        Assert.Equal("SEQUENCE:1", Field(after, "SEQUENCE"));
        Assert.NotEqual(Field(before, "DTSTART"), Field(after, "DTSTART"));
    }

    [Fact]
    public async Task A_community_feed_holds_only_that_communitys_events()
    {
        var events = Events(await (await Feed("all-gta-stream-in-cloud-native-toronto")).Content.ReadAsStringAsync()).ToList();

        Assert.NotEmpty(events);
        Assert.All(events, e => Assert.Contains(Field(e, "SUMMARY"), new[]
        {
            "SUMMARY:Cloud Native Toronto: November meetup", "SUMMARY:Service meshes without tears", "SUMMARY:GitOps with Flux",
            "SUMMARY:Cost-aware autoscaling", "SUMMARY:Cloud Native Toronto: October meetup",
        }));
    }

    [Fact]
    public async Task An_unchanged_feed_answers_304_to_its_etag()
    {
        var first = await Feed("all-stream");

        var again = await Feed("all-stream", first.Headers.ETag!.ToString());

        Assert.Equal(HttpStatusCode.NotModified, again.StatusCode);
        Assert.Equal("public, max-age=900", first.Headers.CacheControl?.ToString());
    }

    [Theory]
    [InlineData("nonsense")]
    [InlineData("ai-everywhere")]
    [InlineData("all-gta-stream-in-no-such-community")]
    public async Task Unknown_slugs_and_communities_are_404(string slug)
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Feed(slug)).StatusCode);
    }

    private sealed class FeedReader(ApiFactory factory)
    {
        public Task<HttpResponseMessage> Get(string slug) => factory.CreateHttpsClient().GetAsync($"/feeds/{slug}.ics");
    }
}
