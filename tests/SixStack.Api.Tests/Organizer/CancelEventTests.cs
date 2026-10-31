using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Identity;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Api.Tests.Moderation;
using SixStack.Application.Organizer;
using SixStack.Infrastructure.Email;

namespace SixStack.Api.Tests.Organizer;

/// <summary>L2-056: POST /api/organizer/events/{id}/cancel.</summary>
public sealed class CancelEventTests
{
    private const string Reason = "Our venue double-booked Hall B. We’re moving to January and will post the new date here.";

    /// <summary>An attendee source that knows two people going to every event.</summary>
    private sealed class KnownAttendeesFactory : ApiFactory
    {
        public sealed class Directory : IAttendeeDirectory
        {
            public Task<IReadOnlyList<string>> EmailsGoingToAsync(Guid eventId, CancellationToken cancellationToken) =>
                Task.FromResult<IReadOnlyList<string>>(["ana@example.com", "ben@example.com"]);
        }

        protected override void ConfigureTestServices(IServiceCollection services) =>
            services.AddScoped<IAttendeeDirectory, Directory>();
    }

    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static Task<Guid> Id(ApiFactory factory, string slug) =>
        factory.WithDbAsync(db => db.Events.Where(e => e.Slug == slug).Select(e => e.Id).SingleAsync());

    private static Task<HttpResponseMessage> Cancel(HttpClient client, Guid id, string? reason = Reason, bool notify = true, string? name = "azure data & ai day gta") =>
        client.PostAsJsonAsync($"/api/organizer/events/{id}/cancel", new { reason, notifyAttendees = notify, confirmationName = name });

    [Fact]
    public async Task Cancelling_marks_the_listing_and_the_feeds_cancelled_and_drops_the_ticket_link()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var id = await Id(factory, "azure-data-ai-day-gta");
        var sequence = await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.Sequence).SingleAsync());

        var response = await Cancel(priya, id);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(("cancelled", 0), (result.GetProperty("status").GetString(), result.GetProperty("emailsQueued").GetInt32()));
        var detail = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/events/azure-data-ai-day-gta");
        Assert.Equal("cancelled", detail.GetProperty("state").GetString());
        Assert.Contains(Reason, detail.GetRawText());
        Assert.DoesNotContain("tickets.example", detail.GetProperty("actions").GetRawText());
        var feed = await factory.CreateHttpsClient().GetStringAsync("/feeds/all-gta-stream.ics");
        var entry = feed.Split("BEGIN:VEVENT").Single(v => v.Contains("SUMMARY:Azure Data & AI Day GTA"));
        Assert.Contains("STATUS:CANCELLED", entry);
        Assert.Equal(sequence + 1, await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.Sequence).SingleAsync()));
        Assert.True(await factory.WithDbAsync(db => db.AuditEntries.AnyAsync(a => a.TargetId == id && a.Action == "EventCancelled")));
        var row = (await priya.GetFromJsonAsync<JsonElement>("/api/organizer/events")).GetProperty("rows").EnumerateArray()
            .Single(r => r.GetProperty("title").GetString() == "Azure Data & AI Day GTA");
        Assert.Equal("Cancelled", row.GetProperty("statusLabel").GetString());
    }

    [Fact]
    public async Task A_cancelled_event_opens_read_only_with_its_reason()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var id = await Id(factory, "azure-data-ai-day-gta");
        (await Cancel(priya, id)).EnsureSuccessStatusCode();

        var e = await priya.GetFromJsonAsync<JsonElement>($"/api/organizer/events/{id}");

        Assert.True(e.GetProperty("isReadOnly").GetBoolean());
        Assert.Equal(("cancelled", Reason), (e.GetProperty("status").GetString(), e.GetProperty("cancellationReason").GetString()));
        Assert.Equal(HttpStatusCode.Conflict, (await Cancel(priya, id)).StatusCode);
    }

    [Fact]
    public async Task A_reason_is_required_and_a_paid_event_needs_its_name_typed()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var id = await Id(factory, "azure-data-ai-day-gta");

        var noReason = await Cancel(priya, id, reason: " ");
        var wrongName = await Cancel(priya, id, name: "Azure Data & AI");

        Assert.Equal(HttpStatusCode.BadRequest, noReason.StatusCode);
        Assert.Equal("Tell attendees why, in a sentence or two.",
            (await noReason.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("reason")[0].GetString());
        Assert.Equal(HttpStatusCode.BadRequest, wrongName.StatusCode);
        Assert.Equal("Type the event name to confirm.",
            (await wrongName.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("confirmationName")[0].GetString());
        Assert.Null(await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.CancelledAtUtc).SingleAsync()));
    }

    [Fact]
    public async Task Known_attendees_are_emailed_the_reason_when_asked()
    {
        using var factory = new KnownAttendeesFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var id = await Id(factory, "azure-data-ai-day-gta");
        var dialog = await priya.GetFromJsonAsync<JsonElement>($"/api/organizer/events/{id}");

        var response = await Cancel(priya, id);
        await factory.RunOutboxAsync();

        Assert.Equal(2, dialog.GetProperty("emailableAttendees").GetInt32());
        Assert.Equal(2, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("emailsQueued").GetInt32());
        var mail = factory.Services.GetRequiredService<DevMailbox>().For("ana@example.com").Single().Message;
        Assert.Equal("“Azure Data & AI Day GTA” is cancelled", mail.Subject);
        Assert.Contains(Reason, mail.TextBody);
    }

    [Fact]
    public async Task Leaving_the_email_option_unchecked_emails_nobody()
    {
        using var factory = new KnownAttendeesFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var response = await Cancel(priya, await Id(factory, "azure-data-ai-day-gta"), notify: false);
        await factory.RunOutboxAsync();

        Assert.Equal(0, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("emailsQueued").GetInt32());
        Assert.Empty(factory.Services.GetRequiredService<DevMailbox>().For("ana@example.com"));
    }

    [Fact]
    public async Task Cancelling_a_submission_in_review_withdraws_it_from_the_queue()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var response = await Cancel(priya, await Id(factory, "fabric-for-power-bi-developers"), name: null);

        response.EnsureSuccessStatusCode();
        var queue = await (await As(factory, HttpClientExtensions.Moderator)).GetFromJsonAsync<JsonElement>("/api/moderation/queue");
        Assert.DoesNotContain(queue.GetProperty("cards").EnumerateArray(), c => c.GetProperty("title").GetString() == "Fabric for Power BI developers");
        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateHttpsClient().GetAsync("/api/events/fabric-for-power-bi-developers")).StatusCode);
    }

    [Fact]
    public async Task Other_communities_and_past_events_cannot_be_cancelled()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var other = await Cancel(priya, await Id(factory, "landing-zones-that-dont-hurt"), name: "Landing zones that don't hurt");
        var past = await Cancel(priya, await Id(factory, "copilot-studio-for-developers"), name: "Copilot Studio for developers");

        Assert.Equal(HttpStatusCode.Forbidden, other.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, past.StatusCode);
    }
}
