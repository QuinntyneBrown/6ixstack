using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Moderation;

/// <summary>
/// Runs each pending check of a submission and stores its result (L2-059). A check that throws stays pending and the
/// message is retried by the outbox; after five failed runs it becomes a warning.
/// </summary>
public sealed partial class RunSubmissionChecksHandler(
    IAppDbContext db,
    IClock clock,
    IGeocoder geocoder,
    ILinkChecker links,
    IOptions<SubmissionChecksOptions> options) : IOutboxMessageHandler<RunSubmissionChecks>
{
    public const int TrustedThreshold = 5;
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task HandleAsync(RunSubmissionChecks message, CancellationToken cancellationToken)
    {
        var e = await db.Events.SingleOrDefaultAsync(x => x.Id == message.EventId, cancellationToken);
        if (e is null)
        {
            return;
        }

        var pending = await db.SubmissionChecks
            .Where(c => c.EventId == e.Id && c.Outcome == CheckOutcome.Pending)
            .ToListAsync(cancellationToken);
        Exception? failure = null;
        foreach (var check in pending)
        {
            try
            {
                var (outcome, text, related) = await RunAsync(check.Kind, e, cancellationToken);
                check.Complete(outcome, text, clock.UtcNow, related);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                check.Failed(clock.UtcNow);
                if (check.Outcome == CheckOutcome.Pending)
                {
                    failure ??= ex;
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        if (failure is not null)
        {
            throw new InvalidOperationException("Some submission checks failed and will be retried.", failure);
        }
    }

    private async Task<(CheckOutcome, string, Guid?)> RunAsync(CheckKind kind, Event e, CancellationToken cancellationToken) => kind switch
    {
        CheckKind.VenueAddress => Plain(await VenueAsync(e, cancellationToken)),
        CheckKind.TicketLink => Plain(await LinkAsync(e.TicketUrl!, "Link reachable", "Ticket link didn't respond", cancellationToken)),
        CheckKind.StreamLink => Plain(await LinkAsync(e.StreamUrl!, "Stream link reachable", "Stream link didn't respond", cancellationToken)),
        CheckKind.Duplicate => await DuplicateAsync(e, cancellationToken),
        CheckKind.OrganizerHistory => Plain(await HistoryAsync(e, cancellationToken)),
        CheckKind.DeveloperRelevance => Plain(Relevance(e)),
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null),
    };

    private static (CheckOutcome, string, Guid?) Plain((CheckOutcome Outcome, string Message) result) => (result.Outcome, result.Message, null);

    private async Task<(CheckOutcome, string)> VenueAsync(Event e, CancellationToken cancellationToken)
    {
        if (e.Venue is null || string.IsNullOrWhiteSpace(e.Venue.Address))
        {
            return (CheckOutcome.Warning, "No venue address");
        }

        return await geocoder.ResolvesAsync(e.Venue.Address, e.Venue.City, cancellationToken)
            ? (CheckOutcome.Passed, "Venue address found")
            : (CheckOutcome.Warning, "Venue address not found on the map");
    }

    private async Task<(CheckOutcome, string)> LinkAsync(string url, string passed, string warning, CancellationToken cancellationToken) =>
        await links.CheckAsync(url, cancellationToken) == LinkCheckResult.Reachable
            ? (CheckOutcome.Passed, passed)
            : (CheckOutcome.Warning, warning);

    /// <summary>Another published or in-review listing that Toronto day from the same sender or community, or with a similar title.</summary>
    private async Task<(CheckOutcome, string, Guid?)> DuplicateAsync(Event e, CancellationToken cancellationToken)
    {
        var day = DateOnly.FromDateTime(TorontoTime.ToLocal(e.StartsAtUtc));
        var from = TorontoTime.StartOf(day);
        var to = TorontoTime.StartOf(day.AddDays(1));
        var sameDay = await db.Events.AsNoTracking()
            .Where(x => x.Id != e.Id && (x.Status == EventStatus.Published || x.Status == EventStatus.InReview))
            .Where(x => x.StartsAtUtc >= from && x.StartsAtUtc < to)
            .ToListAsync(cancellationToken);
        var match = sameDay.FirstOrDefault(x =>
            (x.SubmitterEmail is not null && x.SubmitterEmail == e.SubmitterEmail)
            || (x.CommunityId is not null && x.CommunityId == e.CommunityId)
            || Similarity(x.Title, e.Title) >= 0.5);
        return match is null
            ? (CheckOutcome.Passed, "No duplicates", null)
            : (CheckOutcome.Warning, $"Possible duplicate of a {day.ToString("MMM d", En)} listing", match.Id);
    }

    private async Task<(CheckOutcome, string)> HistoryAsync(Event e, CancellationToken cancellationToken)
    {
        var approved = e.SubmitterEmail is null
            ? 0
            : await db.Events.CountAsync(x => x.Id != e.Id && x.SubmitterEmail == e.SubmitterEmail && x.Status == EventStatus.Published, cancellationToken);
        return approved switch
        {
            0 => (CheckOutcome.Warning, "First submission from this sender"),
            >= TrustedThreshold => (CheckOutcome.Passed, "Trusted organizer"),
            1 => (CheckOutcome.Passed, "Organizer has 1 approved event"),
            _ => (CheckOutcome.Passed, $"Organizer has {approved} approved events"),
        };
    }

    private (CheckOutcome, string) Relevance(Event e)
    {
        var text = $" {e.Title} {e.Description} ".ToLowerInvariant();
        var relevant = options.Value.DeveloperKeywords.Any(k =>
            Regex.IsMatch(text, $@"(?<![\w.#]){Regex.Escape(k.ToLowerInvariant())}(?![\w#])", RegexOptions.CultureInvariant));
        return relevant ? (CheckOutcome.Passed, "Developer topic") : (CheckOutcome.Warning, "Not a developer topic");
    }

    /// <summary>Jaccard overlap of the titles' words of three or more letters, ignoring case.</summary>
    public static double Similarity(string a, string b)
    {
        static HashSet<string> Words(string s) => [.. Word().Matches(s.ToLowerInvariant()).Select(m => m.Value).Where(w => w.Length >= 3)];
        var x = Words(a);
        var y = Words(b);
        if (x.Count == 0 || y.Count == 0)
        {
            return 0;
        }

        return (double)x.Intersect(y).Count() / x.Union(y).Count();
    }

    [GeneratedRegex(@"[\p{L}\p{N}]+")]
    private static partial Regex Word();
}
