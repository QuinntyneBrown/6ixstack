using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Api.Tests.Submissions;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Api.Tests.Moderation;

/// <summary>L2-059: checks run after each submission, through the outbox, and their results reach the queue.</summary>
public sealed class SubmissionChecksTests : IClassFixture<SubmissionChecksTests.ChecksFactory>
{
    private readonly ChecksFactory factory;

    public SubmissionChecksTests(ChecksFactory factory)
    {
        this.factory = factory;
        factory.Links.Reset();
    }

    private async Task Submit(Dictionary<string, object?> body) =>
        (await factory.CreateHttpsClient().PostAsJsonAsync("/api/submissions", body)).EnsureSuccessStatusCode();

    private async Task<QueueCard> Card(string title) => (await factory.QueueAsModeratorAsync()).Cards.Single(c => c.Title == title);

    [Fact]
    public async Task Until_checks_finish_they_show_as_pending_and_the_card_stays_reviewable()
    {
        await Submit(SubmissionTestData.Valid(title: "Blazor at the edge"));

        var card = await Card("Blazor at the edge");

        Assert.NotEmpty(card.Checks);
        Assert.All(card.Checks, c => Assert.Equal(("pending", "Checking…"), (c.Outcome, c.Message)));
    }

    [Fact]
    public async Task An_in_person_submission_gets_venue_link_duplicate_history_and_topic_checks()
    {
        await Submit(SubmissionTestData.Valid(title: "Semantic Kernel agents in .NET"));
        await factory.RunOutboxAsync();

        var card = await Card("Semantic Kernel agents in .NET");

        Assert.Equal(
            ["VenueAddress", "TicketLink", "Duplicate", "OrganizerHistory", "DeveloperRelevance"],
            card.Checks.Select(c => c.Kind));
        Assert.Equal("passed", card.Check("Venue address found").Outcome);
        Assert.Equal("passed", card.Check("Link reachable").Outcome);
        Assert.Equal("passed", card.Check("No duplicates").Outcome);
        Assert.Equal("warning", card.Check("First submission from this sender").Outcome);
        Assert.Equal("passed", card.Check("Developer topic").Outcome);
    }

    [Fact]
    public async Task A_stream_link_that_answers_200_is_reachable()
    {
        await Submit(SubmissionTestData.Valid(title: "Cosmos DB live").With("format", "streaming").With("venueName", null)
            .With("city", null).With("streetAddress", null).With("ticketUrl", null).With("streamUrl", "https://youtube.com/live/cosmos"));
        await factory.RunOutboxAsync();

        var card = await Card("Cosmos DB live");

        Assert.Equal("passed", card.Check("Stream link reachable").Outcome);
        Assert.DoesNotContain(card.Checks, c => c.Kind == "VenueAddress");
    }

    [Fact]
    public async Task A_link_that_times_out_is_a_warning_and_the_submission_stays_in_the_queue()
    {
        factory.Links.TimesOut("https://slow.example.com/tickets");
        await Submit(SubmissionTestData.Valid(title: "Slow tickets meetup").With("ticketUrl", "https://slow.example.com/tickets"));
        await factory.RunOutboxAsync();

        var card = await Card("Slow tickets meetup");

        Assert.Equal("warning", card.Check("Ticket link didn't respond").Outcome);
    }

    [Fact]
    public async Task Another_listing_that_day_from_the_same_sender_is_a_possible_duplicate()
    {
        var email = $"twice-{Guid.NewGuid():N}@example.com";
        await Submit(SubmissionTestData.Valid(email, "Data platform night").With("date", "2026-11-25"));
        await Submit(SubmissionTestData.Valid(email, "Lakehouse lightning talks").With("date", "2026-11-25"));
        await factory.RunOutboxAsync();

        var card = await Card("Lakehouse lightning talks");

        Assert.Equal("warning", card.Check("Possible duplicate of a Nov 25 listing").Outcome);
    }

    [Fact]
    public async Task A_title_and_description_with_no_developer_keyword_is_flagged()
    {
        await Submit(SubmissionTestData.Valid(title: "Passive income with real estate")
            .With("description", "Learn how to buy your first rental property with no money down."));
        await factory.RunOutboxAsync();

        var card = await Card("Passive income with real estate");

        Assert.Equal("warning", card.Check("Not a developer topic").Outcome);
    }

    [Fact]
    public async Task A_sender_with_five_or_more_approved_events_is_trusted()
    {
        await Submit(SubmissionTestData.Valid("priya@gtaazure.ca", "Azure OpenAI office hours"));
        await factory.RunOutboxAsync();

        var card = await Card("Azure OpenAI office hours");

        Assert.Equal("passed", card.Check("Trusted organizer").Outcome);
    }

    [Fact]
    public async Task A_check_that_keeps_failing_becomes_a_warning_after_five_attempts()
    {
        factory.Links.Throws("https://broken.example.com/tickets");
        await Submit(SubmissionTestData.Valid(title: "Flaky checker night").With("ticketUrl", "https://broken.example.com/tickets"));
        for (var attempt = 0; attempt < 5; attempt++)
        {
            await factory.WithDbAsync(async db =>
            {
                foreach (var m in await db.OutboxMessages.Where(m => m.ProcessedAtUtc == null && m.FailedAtUtc == null).ToListAsync())
                {
                    m.NextAttemptAtUtc = ApiFactory.Today;
                }

                return await db.SaveChangesAsync();
            });
            await factory.RunOutboxAsync();
        }

        var card = await Card("Flaky checker night");

        Assert.Equal("warning", card.Checks.Single(c => c.Kind == "TicketLink").Outcome);
        Assert.Equal("Couldn’t run this check", card.Checks.Single(c => c.Kind == "TicketLink").Message);
        Assert.Equal("passed", card.Check("Venue address found").Outcome);
    }

    public sealed class ChecksFactory : ApiFactory
    {
        public FakeLinkChecker Links { get; } = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<ILinkChecker>();
                services.AddSingleton<ILinkChecker>(Links);
            });
        }
    }

    public sealed class FakeLinkChecker : ILinkChecker
    {
        private readonly Dictionary<string, LinkCheckResult> results = [];
        private readonly HashSet<string> throwing = [];

        public void Reset()
        {
            results.Clear();
            throwing.Clear();
        }

        public void TimesOut(string url) => results[url] = LinkCheckResult.Unreachable;

        public void Throws(string url) => throwing.Add(url);

        public Task<LinkCheckResult> CheckAsync(string url, CancellationToken cancellationToken) =>
            throwing.Contains(url)
                ? throw new HttpRequestException("checker unavailable")
                : Task.FromResult(results.GetValueOrDefault(url, LinkCheckResult.Reachable));
    }
}

/// <summary>The real HTTP link checker never probes the server's own network.</summary>
public sealed class HttpLinkCheckerTests
{
    [Fact]
    public async Task Links_to_loopback_or_private_addresses_are_not_requested()
    {
        using var factory = new HttpCheckerFactory();
        var checker = factory.Services.GetRequiredService<ILinkChecker>();

        Assert.Equal(LinkCheckResult.Unreachable, await checker.CheckAsync("https://localhost:1/tickets", CancellationToken.None));
        Assert.Equal(LinkCheckResult.Unreachable, await checker.CheckAsync("https://10.0.0.8/tickets", CancellationToken.None));
    }

    private sealed class HttpCheckerFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("SubmissionChecks:LinkChecker", "Http");
        }
    }
}
