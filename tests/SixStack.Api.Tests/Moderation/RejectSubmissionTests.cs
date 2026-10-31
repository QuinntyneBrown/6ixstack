using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;
using SixStack.Infrastructure.Email;

namespace SixStack.Api.Tests.Moderation;

/// <summary>L2-061 reject, L2-063 first decision wins, L2-066 notification, L2-086 audit.</summary>
public sealed class RejectSubmissionTests
{
    private const string Crypto = "free-crypto-trading-masterclass";

    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static Task<Guid> IdOf(ApiFactory factory, string slug) =>
        factory.WithDbAsync(db => db.Events.Where(e => e.Slug == slug).Select(e => e.Id).SingleAsync());

    private static Task<HttpResponseMessage> Reject(HttpClient client, Guid id, string? reason, string? message = null) =>
        client.PostAsJsonAsync($"/api/moderation/submissions/{id}/reject", new { reason, message });

    [Fact]
    public async Task Rejecting_as_spam_emails_the_sender_with_the_reason_and_message()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, Crypto);

        var response = await Reject(jordan, id, "spamOrAdvertising", "This is advertising for a trading course, not a developer event.");
        await factory.RunOutboxAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("WealthFast Academy", result.GetProperty("organizerName").GetString());
        Assert.Equal("rejected", result.GetProperty("status").GetString());
        var preview = result.GetProperty("emailPreview");
        Assert.Equal("“Free crypto trading masterclass” wasn’t approved", preview.GetProperty("subject").GetString());
        Assert.Contains("Reason: spam or advertising.", preview.GetProperty("body").GetString());
        Assert.Contains("This is advertising for a trading course", preview.GetProperty("body").GetString());
        var mail = Assert.Single(factory.Services.GetRequiredService<DevMailbox>().For("promo@wealthfast.biz"));
        Assert.Equal(preview.GetProperty("subject").GetString(), mail.Message.Subject);
        Assert.Equal(preview.GetProperty("body").GetString(), mail.Message.TextBody);
        var stored = await factory.WithDbAsync(db => db.Events.AsNoTracking().SingleAsync(e => e.Id == id));
        Assert.Equal(EventStatus.Rejected, stored.Status);
        Assert.DoesNotContain((await factory.QueueAsModeratorAsync()).Cards, c => c.Title == "Free crypto trading masterclass");
        Assert.Equal(["SubmissionRejected"], await factory.WithDbAsync(db => db.AuditEntries.Where(a => a.TargetId == id).Select(a => a.Action).ToListAsync()));
        Assert.Equal(1, await factory.WithDbAsync(db => db.Notifications.CountAsync(n => n.RecipientEmail == "promo@wealthfast.biz" && n.Title == "“Free crypto trading masterclass” wasn’t approved")));
    }

    [Fact]
    public async Task A_missing_venue_address_asks_for_changes_instead()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, Crypto);

        var result = await (await Reject(jordan, id, "missingVenueAddress")).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("needsChanges", result.GetProperty("status").GetString());
        Assert.Equal("“Free crypto trading masterclass” needs changes", result.GetProperty("emailPreview").GetProperty("subject").GetString());
        Assert.Contains("Edit it and resubmit", result.GetProperty("emailPreview").GetProperty("body").GetString());
        Assert.Equal(EventStatus.NeedsChanges, await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.Status).SingleAsync()));
    }

    [Fact]
    public async Task A_reason_is_required_and_the_message_has_a_limit()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, Crypto);

        var missing = await Reject(jordan, id, null);
        var tooLong = await Reject(jordan, id, "spamOrAdvertising", new string('x', 1001));

        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        var errors = (await missing.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Choose a reason. The organizer sees it in their email.", errors.GetProperty("reason")[0].GetString());
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);
        Assert.Equal("Keep the message to 1,000 characters or fewer.",
            (await tooLong.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("message")[0].GetString());
    }

    [Fact]
    public async Task Rejecting_what_someone_already_approved_is_refused_naming_them()
    {
        using var factory = new ApiFactory();
        var sam = await As(factory, HttpClientExtensions.SecondModerator);
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await IdOf(factory, "kubernetes-on-a-budget");
        await sam.PostAsync($"/api/moderation/submissions/{id}/approve", null);

        var late = await Reject(jordan, id, "duplicate");

        Assert.Equal(HttpStatusCode.Conflict, late.StatusCode);
        var problem = await late.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(("approved", "Sam"), (problem.GetProperty("decision").GetString(), problem.GetProperty("decidedBy").GetString()));
        Assert.Equal(EventStatus.Published, await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.Status).SingleAsync()));
    }

    [Fact]
    public async Task Only_moderators_can_reject()
    {
        using var factory = new ApiFactory();
        var id = await IdOf(factory, Crypto);

        Assert.Equal(HttpStatusCode.Forbidden, (await Reject(await As(factory, HttpClientExtensions.Organizer), id, "spamOrAdvertising")).StatusCode);
    }
}
