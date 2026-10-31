using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Feeds;

/// <summary>L2-035: POST /api/feeds creates a feed link from a topic and scope choice, without an account.</summary>
public sealed class CreateFeedTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private Task<HttpResponseMessage> Create(object choice) => factory.CreateHttpsClient().PostAsJsonAsync("/api/feeds", choice);

    private async Task<JsonElement> Created(object choice)
    {
        var response = await Create(choice);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task Ai_and_azure_in_the_gta_and_streaming_gives_its_link_count_and_calendar_options()
    {
        var feed = await Created(new { topics = new[] { "ai", "azure" }, allTopics = false, scope = "all" });

        Assert.Equal("ai-azure-gta-stream", feed.GetProperty("feedSlug").GetString());
        var webcal = "webcal://6ixstack.dev/feeds/ai-azure-gta-stream.ics";
        Assert.Equal(webcal, feed.GetProperty("webcalUrl").GetString());
        Assert.Equal("AI and Azure events, in the GTA and streaming.", feed.GetProperty("summary").GetString());
        Assert.Equal(10, feed.GetProperty("matchingEventCount").GetInt32());
        Assert.Equal($"https://calendar.google.com/calendar/r?cid={Uri.EscapeDataString(webcal)}", feed.GetProperty("googleCalendarUrl").GetString());
        Assert.Equal($"https://outlook.live.com/calendar/addcalendar?url={Uri.EscapeDataString(webcal)}", feed.GetProperty("outlookUrl").GetString());
        Assert.Equal(webcal, feed.GetProperty("appleCalendarUrl").GetString());
    }

    [Fact]
    public async Task The_same_choice_in_any_order_gives_the_same_link()
    {
        var first = await Created(new { topics = new[] { "azure", "ai" }, allTopics = false, scope = "all" });
        var second = await Created(new { topics = new[] { "ai", "azure", "ai" }, allTopics = false, scope = "all" });

        Assert.Equal(first.GetProperty("webcalUrl").GetString(), second.GetProperty("webcalUrl").GetString());
    }

    [Fact]
    public async Task All_topics_and_each_scope_have_their_own_words()
    {
        var gta = await Created(new { topics = Array.Empty<string>(), allTopics = true, scope = "gtaOnly" });
        var streaming = await Created(new { topics = new[] { "dotnet", "angular", "react" }, allTopics = false, scope = "streamingOnly" });

        Assert.Equal(("all-gta", "All events, in the GTA only."), (gta.GetProperty("feedSlug").GetString(), gta.GetProperty("summary").GetString()));
        Assert.Equal(("dotnet-angular-react-stream", ".NET, Angular and React events, streaming only."),
            (streaming.GetProperty("feedSlug").GetString(), streaming.GetProperty("summary").GetString()));
    }

    [Fact]
    public async Task No_topic_is_refused_with_the_forms_message()
    {
        var response = await Create(new { topics = Array.Empty<string>(), allTopics = false, scope = "all" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Pick at least one topic, or choose “All topics”.", errors.GetProperty("topics")[0].GetString());
    }

    [Fact]
    public async Task A_community_feed_names_an_existing_community()
    {
        var feed = await Created(new { topics = Array.Empty<string>(), allTopics = true, scope = "all", communitySlug = "gta-azure-community" });
        var unknown = await Create(new { topics = Array.Empty<string>(), allTopics = true, scope = "all", communitySlug = "no-such-group" });

        Assert.Equal("all-gta-stream-in-gta-azure-community", feed.GetProperty("feedSlug").GetString());
        Assert.Equal("GTA Azure Community events, in the GTA and streaming.", feed.GetProperty("summary").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);
    }
}

/// <summary>L2-082: at most 30 feed links an hour from one address (configurable for tests).</summary>
public sealed class CreateFeedRateLimitTests
{
    [Fact]
    public async Task Requests_beyond_the_hourly_limit_are_429()
    {
        using var factory = new SmallLimitFactory();
        var choice = new { topics = new[] { "ai" }, allTopics = false, scope = "all" };
        for (var i = 0; i < 2; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await factory.CreateHttpsClient().PostAsJsonAsync("/api/feeds", choice)).StatusCode);
        }

        var response = await factory.CreateHttpsClient().PostAsJsonAsync("/api/feeds", choice);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.NotNull(response.Headers.RetryAfter);
    }

    private sealed class SmallLimitFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Feeds:CreatePerIpPerHour", "2");
        }
    }
}
