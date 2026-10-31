using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.Site;

/// <summary>L2-072: GET /api/site/stats, the About page's live counts.</summary>
public sealed class SiteStatsTests
{
    [Fact]
    public async Task The_four_counts_come_from_the_data()
    {
        using var factory = new ApiFactory();
        var expected = await factory.WithDbAsync(async db =>
        {
            var yearStart = new DateTimeOffset(2026, 1, 1, 5, 0, 0, TimeSpan.Zero);
            var yearEnd = new DateTimeOffset(2027, 1, 1, 5, 0, 0, TimeSpan.Zero);
            return (
                Communities: await db.Communities.CountAsync(),
                Events: await db.Events.CountAsync(e => e.Status == EventStatus.Published && e.StartsAtUtc >= yearStart && e.StartsAtUtc < yearEnd),
                Subscribers: await db.Communities.SumAsync(c => c.FeedSubscriberCount),
                Moderators: await db.Users.CountAsync(u => u.Role == UserRole.Moderator));
        });

        var response = await factory.CreateHttpsClient().GetAsync("/api/site/stats");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var stats = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(expected.Communities, stats.GetProperty("communities").GetInt32());
        Assert.Equal(expected.Events, stats.GetProperty("eventsListedThisYear").GetInt32());
        Assert.Equal(expected.Subscribers, stats.GetProperty("feedSubscribers").GetInt32());
        Assert.Equal(expected.Moderators, stats.GetProperty("volunteerModerators").GetInt32());
        Assert.Equal(2026, stats.GetProperty("year").GetInt32());
        Assert.True(expected.Events > 0 && expected.Moderators > 0);
    }

    [Fact]
    public async Task A_new_community_and_moderator_are_counted()
    {
        using var factory = new ApiFactory();
        var client = factory.CreateHttpsClient();
        var before = await client.GetFromJsonAsync<JsonElement>("/api/site/stats");
        await factory.WithDbAsync(async db =>
        {
            db.Communities.Add(new Community { Slug = "new-group", Name = "New Group", Initials = "NG", City = "Toronto", FeedSubscriberCount = 7 });
            db.Users.Add(new User { Email = "mod@example.com", Name = "Mo", Role = UserRole.Moderator, CreatedAtUtc = DateTimeOffset.UtcNow });
            await db.SaveChangesAsync();
            return 0;
        });

        var after = await client.GetFromJsonAsync<JsonElement>("/api/site/stats");

        Assert.Equal(before.GetProperty("communities").GetInt32() + 1, after.GetProperty("communities").GetInt32());
        Assert.Equal(before.GetProperty("feedSubscribers").GetInt32() + 7, after.GetProperty("feedSubscribers").GetInt32());
        Assert.Equal(before.GetProperty("volunteerModerators").GetInt32() + 1, after.GetProperty("volunteerModerators").GetInt32());
    }
}
