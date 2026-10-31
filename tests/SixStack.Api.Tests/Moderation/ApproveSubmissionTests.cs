using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.Moderation;

/// <summary>L2-060 approve, L2-063 first decision wins, L2-066 notification, L2-086 audit.</summary>
public sealed class ApproveSubmissionTests
{
    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static Task<Guid> IdOf(ApiFactory factory, string slug) =>
        factory.WithDbAsync(db => db.Events.Where(e => e.Slug == slug).Select(e => e.Id).SingleAsync());

    private static Task<HttpResponseMessage> Approve(HttpClient client, Guid id) =>
        client.PostAsync($"/api/moderation/submissions/{id}/approve", null);

    private static Task<HttpResponseMessage> Undo(HttpClient client, Guid id) =>
        client.PostAsync($"/api/moderation/submissions/{id}/undo-approval", null);

    /// <summary>Runs the outbox as if the 8 s undo window had passed.</summary>
    private static async Task RunHeldMessages(ApiFactory factory)
    {
        await factory.WithDbAsync(async db =>
        {
            foreach (var m in await db.OutboxMessages.Where(m => m.ProcessedAtUtc == null).ToListAsync())
            {
                m.NextAttemptAtUtc = ApiFactory.Today;
            }

            return await db.SaveChangesAsync();
        });
        await factory.RunOutboxAsync();
    }

    [Fact]
    public async Task Approving_publishes_the_event_and_takes_it_out_of_the_queue()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, "rust-in-production-at-scale");

        var response = await Approve(jordan, id);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Rust in production at scale", result.GetProperty("title").GetString());
        Assert.Equal("Toronto Rust Meetup", result.GetProperty("organizerName").GetString());
        Assert.True(result.GetProperty("isPublished").GetBoolean());
        Assert.Equal(ApiFactory.Today.AddSeconds(8), result.GetProperty("undoDeadlineUtc").GetDateTimeOffset());
        Assert.Equal(JsonValueKind.Null, result.GetProperty("possibleDuplicate").ValueKind);
        Assert.Equal(HttpStatusCode.OK, (await factory.CreateHttpsClient().GetAsync("/api/events/rust-in-production-at-scale")).StatusCode);
        Assert.DoesNotContain((await factory.QueueAsModeratorAsync()).Cards, c => c.Title == "Rust in production at scale");
    }

    [Fact]
    public async Task Approving_a_possible_duplicate_names_the_other_listing()
    {
        using var factory = new ApiFactory();
        await factory.RunOutboxAsync();
        var jordan = await As(factory, HttpClientExtensions.Moderator);

        var result = await (await Approve(jordan, await IdOf(factory, "kubernetes-on-a-budget"))).Content.ReadFromJsonAsync<JsonElement>();

        var duplicate = result.GetProperty("possibleDuplicate");
        Assert.Equal("cloud-native-toronto-november-meetup", duplicate.GetProperty("slug").GetString());
        Assert.Equal("Nov 19", duplicate.GetProperty("dateLabel").GetString());
    }

    [Fact]
    public async Task Undo_within_8_seconds_returns_it_to_review_notifies_nobody_and_is_audited()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, "rust-in-production-at-scale");
        await Approve(jordan, id);

        var undo = await Undo(jordan, id);
        await RunHeldMessages(factory);

        Assert.Equal(HttpStatusCode.NoContent, undo.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateHttpsClient().GetAsync("/api/events/rust-in-production-at-scale")).StatusCode);
        Assert.Contains((await factory.QueueAsModeratorAsync()).Cards, c => c.Title == "Rust in production at scale");
        Assert.Equal(0, await factory.WithDbAsync(db => db.Notifications.CountAsync(n => n.Title.Contains("Rust in production"))));
        var jordanId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.Moderator).Select(u => u.Id).SingleAsync());
        var audit = await factory.WithDbAsync(db => db.AuditEntries.Where(a => a.TargetId == id).OrderBy(a => a.Sequence).ToListAsync());
        Assert.Equal(["SubmissionApproved", "ApprovalUndone"], audit.Select(a => a.Action));
        Assert.All(audit, a => Assert.Equal(jordanId, a.ActorId));
    }

    [Fact]
    public async Task Undo_after_the_window_is_refused()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, "rust-in-production-at-scale");
        await Approve(jordan, id);
        await factory.WithDbAsync(async db =>
        {
            var decision = await db.ModerationDecisions.SingleAsync(d => d.EventId == id && d.UndoneAtUtc == null);
            decision.DecidedAtUtc = ApiFactory.Today.AddSeconds(-9);
            return await db.SaveChangesAsync();
        });

        var undo = await Undo(jordan, id);

        Assert.Equal(HttpStatusCode.Conflict, undo.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await factory.CreateHttpsClient().GetAsync("/api/events/rust-in-production-at-scale")).StatusCode);
    }

    [Fact]
    public async Task After_the_window_the_organizer_gets_a_live_notification()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        await Approve(jordan, await IdOf(factory, "fabric-for-power-bi-developers"));

        await RunHeldMessages(factory);

        var notification = await factory.WithDbAsync(db => db.Notifications.AsNoTracking()
            .SingleAsync(n => n.RecipientEmail == HttpClientExtensions.Organizer && n.Title == "“Fabric for Power BI developers” is live"));
        Assert.Equal("/events/fabric-for-power-bi-developers", notification.Link);
    }

    [Fact]
    public async Task An_unverified_senders_event_waits_for_verification()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);

        var result = await (await Approve(jordan, await IdOf(factory, "free-crypto-trading-masterclass"))).Content.ReadFromJsonAsync<JsonElement>();

        Assert.False(result.GetProperty("isPublished").GetBoolean());
        var stored = await factory.WithDbAsync(db => db.Events.AsNoTracking().SingleAsync(e => e.Slug == "free-crypto-trading-masterclass"));
        Assert.Equal(EventStatus.InReview, stored.Status);
        Assert.NotNull(stored.ApprovedAtUtc);
        Assert.DoesNotContain((await factory.QueueAsModeratorAsync()).Cards, c => c.Title == "Free crypto trading masterclass");
    }

    [Fact]
    public async Task The_first_decision_wins_and_a_later_one_is_told_who_decided()
    {
        using var factory = new ApiFactory();
        var sam = await As(factory, HttpClientExtensions.SecondModerator);
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, "kubernetes-on-a-budget");
        await Approve(sam, id);

        var late = await Approve(jordan, id);

        Assert.Equal(HttpStatusCode.Conflict, late.StatusCode);
        var problem = await late.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("approved", problem.GetProperty("decision").GetString());
        Assert.Equal("Sam", problem.GetProperty("decidedBy").GetString());
    }

    [Fact]
    public async Task Only_moderators_can_approve()
    {
        using var factory = new ApiFactory();
        var id = await IdOf(factory, "rust-in-production-at-scale");

        Assert.Equal(HttpStatusCode.Unauthorized, (await Approve(factory.CreateHttpsClient(), id)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Approve(await As(factory, HttpClientExtensions.Organizer), id)).StatusCode);
    }

    [Fact]
    public async Task Presence_names_the_other_moderators_looking_at_a_submission()
    {
        using var factory = new ApiFactory();
        var sam = await As(factory, HttpClientExtensions.SecondModerator);
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, "kubernetes-on-a-budget");
        await sam.PostAsync($"/api/moderation/submissions/{id}/presence", null);

        var seen = await (await jordan.PostAsync($"/api/moderation/submissions/{id}/presence", null)).Content.ReadFromJsonAsync<JsonElement>();
        await factory.WithDbAsync(async db =>
        {
            foreach (var p in await db.ReviewPresences.ToListAsync()) p.LastSeenAtUtc = ApiFactory.Today.AddSeconds(-46);
            return await db.SaveChangesAsync();
        });
        var stale = await (await jordan.PostAsync($"/api/moderation/submissions/{id}/presence", null)).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(["Sam"], seen.GetProperty("others").EnumerateArray().Select(o => o.GetString()));
        Assert.Empty(stale.GetProperty("others").EnumerateArray());
    }
}
