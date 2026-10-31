using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Api.Tests.Moderation;
using SixStack.Infrastructure.Email;

namespace SixStack.Api.Tests.Reports;

/// <summary>L2-039 and L2-040: POST /api/events/{slug}/reports.</summary>
public sealed class ReportProblemTests
{
    private const string Day = "azure-data-ai-day-gta";

    private static Task<HttpResponseMessage> Report(HttpClient client, string slug, object body) =>
        client.PostAsJsonAsync($"/api/events/{slug}/reports", body);

    [Fact]
    public async Task A_wrong_details_report_is_stored_and_reaches_organizers_and_moderators_without_the_reporter()
    {
        using var factory = new ApiFactory();

        var response = await Report(factory.CreateHttpsClient(), Day, new { reason = "wrongDetails", details = "The ticket page says 9:30 AM.", replyEmail = "reporter@example.com" });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.True(await factory.WithDbAsync(db => db.ProblemReports.AnyAsync(r => r.Details == "The ticket page says 9:30 AM.")));
        var notes = await factory.WithDbAsync(db => db.Notifications.Where(n => n.Title.StartsWith("Someone reported")).ToListAsync());
        var organizer = notes.Where(n => n.RecipientEmail == HttpClientExtensions.Organizer).ToList();
        var priya = Assert.Single(organizer);
        Assert.Equal(("Someone reported the time on Azure Data & AI Day GTA", "“The ticket page says 9:30 AM.” Check and update the listing if needed.", "warning"),
            (priya.Title, priya.Text, priya.Tone));
        Assert.Contains(notes, n => n.RecipientEmail == "marcus@gtaazure.ca");
        Assert.Contains(notes, n => n.RecipientEmail == HttpClientExtensions.Moderator && n.Link!.StartsWith("/organize/events/", StringComparison.Ordinal));
        Assert.DoesNotContain(notes, n => (n.Text ?? string.Empty).Contains("reporter@example.com") || n.Title.Contains("reporter@example.com"));
    }

    [Fact]
    public async Task Organizers_are_emailed_when_report_emails_are_on()
    {
        using var factory = new ApiFactory();
        await factory.WithDbAsync(async db =>
        {
            (await db.Users.SingleAsync(u => u.Email == "marcus@gtaazure.ca")).EmailPreferences.ProblemReports = false;
            return await db.SaveChangesAsync();
        });

        await Report(factory.CreateHttpsClient(), Day, new { reason = "brokenLink", details = "The ticket link 404s." });
        await factory.RunOutboxAsync();

        var mailbox = factory.Services.GetRequiredService<DevMailbox>();
        var mail = Assert.Single(mailbox.For(HttpClientExtensions.Organizer)).Message;
        Assert.Equal("Someone reported a broken link on Azure Data & AI Day GTA", mail.Subject);
        Assert.Empty(mailbox.For("marcus@gtaazure.ca"));
    }

    [Fact]
    public async Task A_conduct_concern_goes_to_two_moderators_and_never_to_the_organizer()
    {
        using var factory = new ApiFactory();

        await Report(factory.CreateHttpsClient(), Day, new { reason = "codeOfConduct", details = "A speaker made a hurtful joke." });

        var notes = await factory.WithDbAsync(db => db.Notifications.Where(n => n.Title.Contains("Azure Data & AI Day GTA") && n.CreatedAtUtc == ApiFactory.Today).ToListAsync());
        Assert.Equal(2, notes.Count);
        Assert.All(notes, n => Assert.Contains(n.RecipientEmail, new[] { HttpClientExtensions.Moderator, HttpClientExtensions.SecondModerator }));
        Assert.All(notes, n => Assert.Equal("Code of conduct concern about Azure Data & AI Day GTA", n.Title));
    }

    [Fact]
    public async Task A_reason_is_required_and_the_reply_email_and_details_are_checked()
    {
        using var factory = new ApiFactory();
        var client = factory.CreateHttpsClient();

        var noReason = await Report(client, Day, new { details = "Something" });
        var badEmail = await Report(client, Day, new { reason = "spam", replyEmail = "not-an-email" });
        var tooLong = await Report(client, Day, new { reason = "spam", details = new string('x', 2001) });

        Assert.Equal("Choose what is wrong so we can route it to the right person.",
            (await noReason.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("reason")[0].GetString());
        Assert.Equal("Enter an email address like name@example.com.",
            (await badEmail.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("replyEmail")[0].GetString());
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Report(client, "no-such-event", new { reason = "spam" })).StatusCode);
    }

    [Fact]
    public async Task The_eleventh_report_from_one_address_in_an_hour_is_refused()
    {
        using var factory = new ApiFactory();
        var client = factory.CreateHttpsClient();

        for (var i = 0; i < 10; i++)
        {
            Assert.Equal(HttpStatusCode.Accepted, (await Report(client, Day, new { reason = "spam" })).StatusCode);
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, (await Report(client, Day, new { reason = "spam" })).StatusCode);
    }
}
