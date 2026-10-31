using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;
using SixStack.Infrastructure.Email;
using SixStack.Infrastructure.Outbox;

namespace SixStack.Api.Tests.Submissions;

/// <summary>L2-041 to L2-043 and L2-085: POST /api/submissions, with "today" Monday, November 2, 2026.</summary>
public sealed class SubmitEventTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private Task<HttpResponseMessage> Submit(object body) => factory.CreateHttpsClient().PostAsJsonAsync("/api/submissions", body);

    private static async Task<Dictionary<string, string[]>> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        return problem.GetProperty("errors").EnumerateObject()
            .ToDictionary(p => p.Name, p => p.Value.EnumerateArray().Select(v => v.GetString()!).ToArray());
    }

    private async Task<IReadOnlyList<DevMailboxEntry>> MailTo(string email)
    {
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<OutboxDispatcher>().ProcessDueAsync(CancellationToken.None);
        return factory.Services.GetRequiredService<DevMailbox>().For(email);
    }

    [Fact]
    public async Task Valid_submission_is_stored_in_review_and_kept_out_of_the_public_list()
    {
        var body = SubmissionTestData.Valid(title: "Fabric deployment pipelines");

        var response = await Submit(body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var received = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Fabric deployment pipelines", received.GetProperty("eventTitle").GetString());
        Assert.Equal(body["contactEmail"], received.GetProperty("contactEmail").GetString());
        var stored = await factory.WithDbAsync(db => db.Events.AsNoTracking().SingleAsync(e => e.Title == "Fabric deployment pipelines"));
        Assert.Equal(EventStatus.InReview, stored.Status);
        Assert.Null(stored.CommunityId);
        Assert.Equal("GTA Azure Community", stored.OrganizerName);
        Assert.Equal(new DateTimeOffset(2026, 11, 18, 23, 30, 0, TimeSpan.Zero), stored.StartsAtUtc);
        Assert.Equal(("Living Arts Centre", "4141 Living Arts Dr", "Mississauga"), (stored.Venue!.Name, stored.Venue.Address, stored.Venue.City));
        Assert.Equal(Topics.Azure, stored.Topics);
        var list = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/events?q=pipelines&page=1");
        Assert.Equal(0, list.GetProperty("total").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateHttpsClient().GetAsync($"/api/events/{stored.Slug}")).StatusCode);
    }

    [Fact]
    public async Task Invalid_submission_returns_the_forms_field_errors()
    {
        var body = SubmissionTestData.Valid().With("title", "").With("topics", Array.Empty<string>()).With("endTime", "17:30");

        var errors = await Errors(await Submit(body));

        Assert.Equal(["Enter a title for the event."], errors["title"]);
        Assert.Equal(["Pick at least one topic so people can find it."], errors["topics"]);
        Assert.Equal(["End time must be after the 6:30 PM start."], errors["endTime"]);
        Assert.Equal(3, errors.Count);
    }

    [Fact]
    public async Task In_person_and_hybrid_need_a_venue_name_and_street_address()
    {
        var errors = await Errors(await Submit(SubmissionTestData.Valid().With("format", "hybrid").With("venueName", "").With("streetAddress", " ")));

        Assert.Equal(["Enter the venue name."], errors["venueName"]);
        Assert.Equal(["Enter the street address."], errors["streetAddress"]);
    }

    [Fact]
    public async Task Streaming_events_carry_no_venue()
    {
        var errors = await Errors(await Submit(SubmissionTestData.Valid().With("format", "streaming")));
        var ok = await Submit(SubmissionTestData.Valid(title: "Fabric online").With("format", "streaming")
            .With("venueName", null).With("city", null).With("streetAddress", null).With("streamUrl", "https://youtube.com/live/abc"));

        Assert.Equal(["A streaming event has no venue."], errors["venueName"]);
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task Paid_event_needs_a_price_above_zero(object? price)
    {
        var errors = await Errors(await Submit(SubmissionTestData.Valid().With("isFree", false).With("priceCad", price)));

        Assert.Equal(["Enter a price above $0."], errors["priceCad"]);
    }

    [Fact]
    public async Task Links_must_start_with_https()
    {
        var errors = await Errors(await Submit(SubmissionTestData.Valid().With("format", "hybrid")
            .With("ticketUrl", "http://tickets.example.com").With("streamUrl", "javascript:alert(1)")));

        Assert.Equal(["Enter a full link that starts with https://"], errors["ticketUrl"]);
        Assert.Equal(["Enter a full link that starts with https://"], errors["streamUrl"]);
    }

    [Fact]
    public async Task Date_cannot_be_in_the_past_and_fields_have_limits()
    {
        var errors = await Errors(await Submit(SubmissionTestData.Valid().With("date", "2026-11-01")
            .With("title", new string('t', 91)).With("description", new string('d', 2001)).With("contactEmail", "not-an-email")));

        Assert.Equal(["Choose a date that hasn't passed."], errors["date"]);
        Assert.Equal(["Keep the title to 90 characters or fewer."], errors["title"]);
        Assert.Equal(["Keep the description to 2,000 characters or fewer."], errors["description"]);
        Assert.Equal(["Enter an email address like name@example.com."], errors["contactEmail"]);
    }

    [Fact]
    public async Task First_submission_from_an_address_sends_a_confirmation_and_a_verification_email()
    {
        var email = $"first-{Guid.NewGuid():N}@example.com";
        await Submit(SubmissionTestData.Valid(email, "Fabric office hours"));

        var mail = await MailTo(email);

        Assert.Contains(mail, m => m.Message.Subject == "We got “Fabric office hours”");
        var verify = Assert.Single(mail, m => m.Message.Subject == "Verify your email to publish events");
        Assert.Contains("https://6ixstack.dev/auth/verify-email?token=", verify.Message.TextBody);
    }

    [Fact]
    public async Task Later_submissions_from_the_same_address_send_no_new_verification()
    {
        var email = $"again-{Guid.NewGuid():N}@example.com";
        await Submit(SubmissionTestData.Valid(email, "First one"));
        await MailTo(email);
        await Submit(SubmissionTestData.Valid(email, "Second one"));

        var mail = await MailTo(email);

        Assert.Single(mail, m => m.Message.Subject == "Verify your email to publish events");
        Assert.Equal(2, mail.Count(m => m.Message.Subject.StartsWith("We got", StringComparison.Ordinal)));
    }

    [Fact]
    public async Task Verifying_the_email_publishes_events_a_moderator_already_approved()
    {
        var email = $"verify-{Guid.NewGuid():N}@example.com";
        await Submit(SubmissionTestData.Valid(email, "Approved before verification"));
        var link = (await MailTo(email)).Single(m => m.Message.Subject.StartsWith("Verify", StringComparison.Ordinal)).Message.TextBody;
        var token = link[(link.IndexOf("token=", StringComparison.Ordinal) + 6)..].Split(['\n', ' ', '\r'])[0];
        await factory.WithDbAsync(async db =>
        {
            var e = await db.Events.SingleAsync(x => x.Title == "Approved before verification");
            e.ApprovedAtUtc = ApiFactory.Today;
            return await db.SaveChangesAsync();
        });

        var response = await factory.CreateHttpsClient().GetAsync($"/auth/verify-email?token={token}");

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/?email-verified=1", response.Headers.Location?.OriginalString);
        var published = await factory.WithDbAsync(db => db.Events.AsNoTracking().SingleAsync(e => e.Title == "Approved before verification"));
        Assert.Equal(EventStatus.Published, published.Status);
        var again = await factory.CreateHttpsClient().GetAsync($"/auth/verify-email?token={token}");
        Assert.Equal("/?email-verified=0", again.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task Eleventh_submission_in_a_day_from_one_address_is_rate_limited()
    {
        var email = $"busy-{Guid.NewGuid():N}@example.com";
        for (var i = 0; i < 10; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await Submit(SubmissionTestData.Valid(email, $"Talk {i}"))).StatusCode);
        }

        var response = await Submit(SubmissionTestData.Valid(email, "Talk 11"));

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.NotNull(response.Headers.RetryAfter);
    }

    [Fact]
    public async Task Reference_data_lists_topics_cities_and_time_zones()
    {
        var data = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/reference-data");

        Assert.Equal(["ai", "dotnet", "azure", "angular", "react", "aws"], data.GetProperty("topics").EnumerateArray().Select(t => t.GetProperty("key").GetString()));
        Assert.Contains("Mississauga", data.GetProperty("cities").EnumerateArray().Select(c => c.GetString()));
        Assert.Contains(data.GetProperty("timeZones").EnumerateArray(), z => z.GetProperty("id").GetString() == "America/Toronto" && z.GetProperty("label").GetString() == "America/Toronto (ET)");
    }
}
