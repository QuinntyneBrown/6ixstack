using System.Net.Http.Json;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Api.Tests.Moderation;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Notifications;
using SixStack.Infrastructure.Email;

namespace SixStack.Api.Tests.Notifications;

/// <summary>L2-067: notification emails follow the organizer's preferences; rejections always go out.</summary>
public sealed class EmailNotificationTests
{
    private const string Priya = HttpClientExtensions.Organizer;

    /// <summary>An email provider that is down.</summary>
    private sealed class FailingEmailFactory : ApiFactory
    {
        private sealed class DownSender : IEmailSender
        {
            public Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default) =>
                throw new InvalidOperationException("The email provider is down.");
        }

        protected override void ConfigureTestServices(IServiceCollection services) => services.AddScoped<IEmailSender, DownSender>();
    }

    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static Task<Guid> Id(ApiFactory factory, string slug) =>
        factory.WithDbAsync(db => db.Events.Where(e => e.Slug == slug).Select(e => e.Id).SingleAsync());

    /// <summary>
    /// Runs the outbox as if the undo window had passed, twice, since a handled message can queue the email that the
    /// next poll sends.
    /// </summary>
    private static async Task RunAll(ApiFactory factory)
    {
        for (var pass = 0; pass < 2; pass++)
        {
            await factory.WithDbAsync(async db =>
            {
                foreach (var m in await db.OutboxMessages.Where(m => m.ProcessedAtUtc == null && m.AttemptCount == 0).ToListAsync())
                {
                    m.NextAttemptAtUtc = ApiFactory.Today;
                }

                return await db.SaveChangesAsync();
            });
            await factory.RunOutboxAsync();
        }
    }

    private static Task SetPreferences(ApiFactory factory, Action<Domain.Entities.User> change) =>
        factory.WithDbAsync(async db =>
        {
            var user = await db.Users.SingleAsync(u => u.Email == Priya);
            change(user);
            return await db.SaveChangesAsync();
        });

    private static IReadOnlyList<EmailMessage> Mail(ApiFactory factory, string to) =>
        [.. factory.Services.GetRequiredService<DevMailbox>().For(to).Select(m => m.Message)];

    [Fact]
    public async Task An_approval_is_emailed_after_the_undo_window()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);

        await jordan.PostAsync($"/api/moderation/submissions/{await Id(factory, "fabric-for-power-bi-developers")}/approve", null);
        Assert.DoesNotContain(Mail(factory, Priya), m => m.Subject.EndsWith("is live", StringComparison.Ordinal));
        await RunAll(factory);

        var mail = Assert.Single(Mail(factory, Priya), m => m.Subject == "“Fabric for Power BI developers” is live");
        Assert.Contains("/events/fabric-for-power-bi-developers", mail.TextBody);
        Assert.True(await factory.WithDbAsync(db => db.Notifications.AnyAsync(n => n.RecipientEmail == Priya && n.Title == "“Fabric for Power BI developers” is live")));
    }

    [Fact]
    public async Task With_event_decisions_off_approvals_and_send_backs_are_not_emailed_but_rejections_are()
    {
        using var factory = new ApiFactory();
        await SetPreferences(factory, u => u.EmailPreferences.EventDecisions = false);
        var jordan = await As(factory, HttpClientExtensions.Moderator);

        await jordan.PostAsync($"/api/moderation/submissions/{await Id(factory, "fabric-for-power-bi-developers")}/approve", null);
        await RunAll(factory);

        Assert.DoesNotContain(Mail(factory, Priya), m => m.Subject.EndsWith("is live", StringComparison.Ordinal));
        Assert.True(await factory.WithDbAsync(db => db.Notifications.AnyAsync(n => n.RecipientEmail == Priya && n.Title.EndsWith("is live"))));

        await jordan.PostAsync($"/api/moderation/submissions/{await Id(factory, "fabric-for-power-bi-developers")}/undo-approval", null);
        await jordan.PostAsJsonAsync($"/api/moderation/submissions/{await Id(factory, "fabric-for-power-bi-developers")}/reject", new { reason = "missingVenueAddress" });
        await RunAll(factory);
        Assert.DoesNotContain(Mail(factory, Priya), m => m.Subject.EndsWith("needs changes", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_rejection_is_emailed_whatever_the_preferences()
    {
        using var factory = new ApiFactory();
        await SetPreferences(factory, u => u.EmailPreferences.EventDecisions = false);
        var jordan = await As(factory, HttpClientExtensions.Moderator);

        await jordan.PostAsJsonAsync($"/api/moderation/submissions/{await Id(factory, "fabric-for-power-bi-developers")}/reject", new { reason = "notDeveloperEvent" });
        await RunAll(factory);

        Assert.Contains(Mail(factory, Priya), m => m.Subject == "“Fabric for Power BI developers” wasn’t approved");
    }

    [Fact]
    public async Task A_moderators_edit_is_emailed_to_the_organizer_with_what_changed()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await Id(factory, "fabric-for-power-bi-developers");
        var e = await jordan.GetFromJsonAsync<JsonElement>($"/api/organizer/events/{id}");
        var details = JsonSerializer.Deserialize<Dictionary<string, object?>>(e.GetProperty("details").GetRawText())!;
        details["startTime"] = "19:00";
        details["endTime"] = "21:00";

        (await jordan.PutAsJsonAsync($"/api/organizer/events/{id}", details)).EnsureSuccessStatusCode();
        await RunAll(factory);

        var mail = Assert.Single(Mail(factory, Priya), m => m.Subject == "A moderator updated “Fabric for Power BI developers”");
        Assert.Contains("Jordan from 6ixstack updated “Fabric for Power BI developers”: start time, end time.", mail.TextBody);
    }

    [Fact]
    public async Task An_organizers_own_edit_is_not_emailed()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, Priya);
        var id = await Id(factory, "fabric-for-power-bi-developers");
        var e = await priya.GetFromJsonAsync<JsonElement>($"/api/organizer/events/{id}");
        var details = JsonSerializer.Deserialize<Dictionary<string, object?>>(e.GetProperty("details").GetRawText())!;
        details["startTime"] = "19:00";
        details["endTime"] = "21:00";

        (await priya.PutAsJsonAsync($"/api/organizer/events/{id}", details)).EnsureSuccessStatusCode();
        await RunAll(factory);

        Assert.DoesNotContain(Mail(factory, Priya), m => m.Subject.StartsWith("A moderator updated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task The_weekly_summary_goes_only_to_organizers_who_turned_it_on()
    {
        using var factory = new ApiFactory();
        await factory.RunOutboxAsync();
        async Task RunWeekly()
        {
            using var scope = factory.Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<ISender>().Send(new SendWeeklySummariesCommand());
            await RunAll(factory);
        }

        await RunWeekly();
        Assert.DoesNotContain(Mail(factory, Priya), m => m.Subject == "Your week on 6ixstack");

        await SetPreferences(factory, u => u.EmailPreferences.WeeklySummary = true);
        await RunWeekly();

        var mail = Assert.Single(Mail(factory, Priya), m => m.Subject == "Your week on 6ixstack");
        Assert.Contains("• Azure Data & AI Day GTA · Thu, Nov 5 · 318 going", mail.TextBody);
        Assert.Contains("1,204 people follow GTA Azure Community in a calendar feed.", mail.TextBody);
        Assert.DoesNotContain(Mail(factory, "marcus@gtaazure.ca"), m => m.Subject == "Your week on 6ixstack");
    }

    [Fact]
    public async Task A_failed_send_keeps_the_notification_and_is_retried()
    {
        using var factory = new FailingEmailFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);

        await jordan.PostAsync($"/api/moderation/submissions/{await Id(factory, "fabric-for-power-bi-developers")}/approve", null);
        await RunAll(factory);

        Assert.True(await factory.WithDbAsync(db => db.Notifications.AnyAsync(n => n.RecipientEmail == Priya && n.Title.EndsWith("is live"))));
        var pending = await factory.WithDbAsync(db => db.OutboxMessages.Where(m => m.ProcessedAtUtc == null && m.Type.Contains("SendEmail")).ToListAsync());
        var email = Assert.Single(pending);
        Assert.Equal(1, email.AttemptCount);
        Assert.True(email.NextAttemptAtUtc > ApiFactory.Today);
    }
}
