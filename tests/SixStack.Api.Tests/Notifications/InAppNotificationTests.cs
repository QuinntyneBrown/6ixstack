using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Api.Tests.Moderation;

namespace SixStack.Api.Tests.Notifications;

/// <summary>L2-065 and L2-066: the notifications API and its triggers, with "now" Monday, November 2, 2026.</summary>
public sealed class InAppNotificationTests
{
    private const string Marcus = "marcus@gtaazure.ca";

    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static async Task<JsonElement> List(HttpClient client) => await client.GetFromJsonAsync<JsonElement>("/api/notifications");

    [Fact]
    public async Task The_list_is_newest_first_with_the_unread_count_and_time_labels()
    {
        using var factory = new ApiFactory();

        var list = await List(await As(factory, Marcus));

        Assert.Equal(3, list.GetProperty("unreadCount").GetInt32());
        var items = list.GetProperty("items").EnumerateArray().ToList();
        Assert.Equal(5, items.Count);
        Assert.Equal(("1,204 people now follow your events in a feed", "Yesterday", false),
            (items[0].GetProperty("title").GetString(), items[0].GetProperty("timeLabel").GetString(), items[0].GetProperty("isRead").GetBoolean()));
        Assert.Equal(("“Azure Bicep clinic” needs changes", "danger", "Oct 30"),
            (items[1].GetProperty("title").GetString(), items[1].GetProperty("tone").GetString(), items[1].GetProperty("timeLabel").GetString()));
        Assert.Equal(("success", true), (items[3].GetProperty("tone").GetString(), items[3].GetProperty("isRead").GetBoolean()));
        Assert.All(items, i => Assert.False(string.IsNullOrEmpty(i.GetProperty("link").GetString())));
    }

    [Fact]
    public async Task Opening_one_marks_it_read_and_others_cannot_touch_it()
    {
        using var factory = new ApiFactory();
        var marcus = await As(factory, Marcus);
        var first = (await List(marcus)).GetProperty("items")[0].GetProperty("id").GetString();

        var priya = await (await As(factory, HttpClientExtensions.Organizer)).PostAsync($"/api/notifications/{first}/read", null);
        var mine = await marcus.PostAsync($"/api/notifications/{first}/read", null);

        Assert.Equal(HttpStatusCode.NotFound, priya.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, mine.StatusCode);
        Assert.Equal(2, (await List(marcus)).GetProperty("unreadCount").GetInt32());
    }

    [Fact]
    public async Task Mark_all_as_read_clears_the_count_and_the_header()
    {
        using var factory = new ApiFactory();
        var marcus = await As(factory, Marcus);
        Assert.Equal(3, (await marcus.GetFromJsonAsync<JsonElement>("/api/auth/me")).GetProperty("unreadNotificationCount").GetInt32());

        var response = await marcus.PostAsync("/api/notifications/read-all", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(0, (await List(marcus)).GetProperty("unreadCount").GetInt32());
        var me = await marcus.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.Equal(0, me.GetProperty("unreadNotificationCount").GetInt32());
    }

    [Fact]
    public async Task An_approval_tells_the_organizer_it_is_live()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await factory.WithDbAsync(db => db.Events.Where(e => e.Slug == "fabric-for-power-bi-developers").Select(e => e.Id).SingleAsync());
        await jordan.PostAsync($"/api/moderation/submissions/{id}/approve", null);
        await factory.WithDbAsync(async db =>
        {
            foreach (var m in await db.OutboxMessages.Where(m => m.ProcessedAtUtc == null).ToListAsync())
            {
                m.NextAttemptAtUtc = ApiFactory.Today;
            }

            return await db.SaveChangesAsync();
        });
        await factory.RunOutboxAsync();

        var item = (await List(await As(factory, HttpClientExtensions.Organizer))).GetProperty("items").EnumerateArray()
            .Single(i => i.GetProperty("title").GetString() == "“Fabric for Power BI developers” is live");
        Assert.Equal(("success", "/events/fabric-for-power-bi-developers", "Just now"),
            (item.GetProperty("tone").GetString(), item.GetProperty("link").GetString(), item.GetProperty("timeLabel").GetString()));
    }

    [Fact]
    public async Task A_new_submission_tells_every_moderator()
    {
        using var factory = new ApiFactory();
        await factory.RunOutboxAsync();

        var submitted = await factory.CreateHttpsClient().PostAsJsonAsync("/api/submissions", new
        {
            title = "Testing tools night",
            organizerName = "Toronto Test Meetup",
            description = "A short talk about testing developer tools.",
            topics = new[] { "dotnet" },
            date = "2026-12-02",
            timeZoneId = "America/Toronto",
            startTime = "18:00",
            endTime = "20:00",
            format = "inPerson",
            venueName = "Centre for Social Innovation",
            city = "Toronto",
            streetAddress = "192 Spadina Ave",
            isFree = true,
            contactEmail = "tester@example.com",
        });
        submitted.EnsureSuccessStatusCode();

        foreach (var moderator in new[] { HttpClientExtensions.Moderator, HttpClientExtensions.SecondModerator })
        {
            var items = (await List(await As(factory, moderator))).GetProperty("items").EnumerateArray().ToList();
            var item = Assert.Single(items, i => i.GetProperty("title").GetString() == "New submission: “Testing tools night”");
            Assert.Equal("/admin/review", item.GetProperty("link").GetString());
        }
    }

    [Fact]
    public async Task Anonymous_callers_are_refused()
    {
        using var factory = new ApiFactory();

        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/notifications")).StatusCode);
    }
}
