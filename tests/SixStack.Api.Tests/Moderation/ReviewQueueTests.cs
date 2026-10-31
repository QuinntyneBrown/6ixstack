using System.Net;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.Moderation;

/// <summary>L2-057 access and L2-058 content of GET /api/moderation/queue, on the seeded mock cast.</summary>
public sealed class ReviewQueueTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Anonymous_callers_get_401_and_organizers_403()
    {
        var anonymous = await factory.CreateHttpsClient().GetAsync("/api/moderation/queue");
        var organizer = factory.CreateHttpsClient();
        await organizer.SignInAsAsync(HttpClientExtensions.Organizer);

        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await organizer.GetAsync("/api/moderation/queue")).StatusCode);
    }

    [Fact]
    public async Task Lists_waiting_submissions_oldest_first_under_a_summary()
    {
        await factory.RunOutboxAsync();

        var (summary, cards) = await factory.QueueAsModeratorAsync();

        Assert.Equal("4 waiting · oldest submitted yesterday · median review time 3 h", summary);
        Assert.Equal(
            ["Free crypto trading masterclass", "Fabric for Power BI developers", "Kubernetes on a budget", "Rust in production at scale"],
            cards.Select(c => c.Title));
    }

    [Fact]
    public async Task A_card_carries_its_labels_topics_submitter_and_check_results()
    {
        await factory.RunOutboxAsync();

        var (_, cards) = await factory.QueueAsModeratorAsync();
        var kubernetes = cards.Single(c => c.Title == "Kubernetes on a budget");

        Assert.Equal("Cloud Native Toronto", kubernetes.Organizer);
        Assert.Equal("Thu, Nov 19 · 6:00 PM", kubernetes.WhenLabel);
        Assert.Equal("Streaming online", kubernetes.WhereLabel);
        Assert.Equal(["azure", "aws"], kubernetes.Topics);
        Assert.Equal("5 hours ago", kubernetes.SubmittedLabel);
        Assert.Equal("hello@cloudnativeto.ca", kubernetes.SubmitterEmail);
        Assert.Equal("passed", kubernetes.Check("Stream link reachable").Outcome);
        Assert.Equal("warning", kubernetes.Check("Possible duplicate of a Nov 19 listing").Outcome);
        Assert.Equal("passed", kubernetes.Check("Organizer has 4 approved events").Outcome);
    }

    [Fact]
    public async Task Warnings_flag_the_submissions_that_need_a_closer_look()
    {
        await factory.RunOutboxAsync();

        var (_, cards) = await factory.QueueAsModeratorAsync();
        var crypto = cards.Single(c => c.Title == "Free crypto trading masterclass");
        var fabric = cards.Single(c => c.Title == "Fabric for Power BI developers");
        var rust = cards.Single(c => c.Title == "Rust in production at scale");

        Assert.Equal("Address not given", crypto.WhereLabel);
        Assert.Equal("warning", crypto.Check("No venue address").Outcome);
        Assert.Equal("warning", crypto.Check("Not a developer topic").Outcome);
        Assert.Equal("warning", crypto.Check("First submission from this sender").Outcome);
        Assert.Equal("passed", fabric.Check("Trusted organizer").Outcome);
        Assert.Equal("Yesterday", fabric.SubmittedLabel);
        Assert.Empty(rust.Topics);
        Assert.Equal("passed", rust.Check("Venue address found").Outcome);
        Assert.Equal("passed", rust.Check("Link reachable").Outcome);
        Assert.Equal("passed", rust.Check("No duplicates").Outcome);
    }

    [Fact]
    public async Task With_nothing_waiting_the_summary_gives_the_time_since_the_last_approval()
    {
        using var empty = new ApiFactory();
        await empty.WithDbAsync(async db =>
        {
            foreach (var e in await db.Events.Where(e => e.Status == EventStatus.InReview).ToListAsync())
            {
                e.Status = EventStatus.Rejected;
            }

            return await db.SaveChangesAsync();
        });

        var (summary, cards) = await empty.QueueAsModeratorAsync();

        Assert.Empty(cards);
        Assert.Equal("0 waiting · last approval 12 minutes ago", summary);
    }
}
