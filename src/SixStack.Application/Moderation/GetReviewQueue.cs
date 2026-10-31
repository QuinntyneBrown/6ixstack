using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Moderation;

public sealed record SubmissionCheckDto(string Kind, string Outcome, string Message);

/// <summary>One waiting submission, with display labels so the card holds no formatting rules.</summary>
public sealed record ReviewCardDto(
    Guid Id,
    string Slug,
    string Title,
    string Organizer,
    string WhenLabel,
    string WhereLabel,
    IReadOnlyList<string> Topics,
    string SubmittedLabel,
    string SubmitterEmail,
    IReadOnlyList<SubmissionCheckDto> Checks);

public sealed record ReviewQueueDto(string Summary, int WaitingCount, IReadOnlyList<ReviewCardDto> Cards);

/// <summary>In-review submissions oldest first, under a summary (L2-058). Approvals awaiting verification are excluded.</summary>
public sealed record GetReviewQueueQuery : IRequest<ReviewQueueDto>;

public sealed class GetReviewQueueQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetReviewQueueQuery, ReviewQueueDto>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<ReviewQueueDto> Handle(GetReviewQueueQuery request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var events = await db.Events.AsNoTracking().Include(e => e.Community)
            .Where(e => e.Status == EventStatus.InReview && e.ApprovedAtUtc == null && e.CancelledAtUtc == null)
            .ToListAsync(cancellationToken);
        events = [.. events.OrderBy(e => e.SubmittedAtUtc)];
        var ids = events.Select(e => e.Id).ToList();
        var checks = (await db.SubmissionChecks.AsNoTracking().Where(c => ids.Contains(c.EventId)).ToListAsync(cancellationToken))
            .ToLookup(c => c.EventId);
        var cards = events.Select(e => Card(e, checks[e.Id], now)).ToList();
        return new ReviewQueueDto(await SummaryAsync(events, now, cancellationToken), cards.Count, cards);
    }

    private static ReviewCardDto Card(Event e, IEnumerable<SubmissionCheck> checks, DateTimeOffset now) => new(
        e.Id,
        e.Slug,
        e.Title,
        e.Community?.Name ?? e.OrganizerName ?? string.Empty,
        $"{TorontoTime.ToLocal(e.StartsAtUtc).ToString("ddd, MMM d", En)} · {TorontoTime.Time(e.StartsAtUtc)}",
        Where(e),
        TopicKeys.Of(e.Topics),
        Relative(e.SubmittedAtUtc ?? now, now, capitalise: true),
        e.SubmitterEmail ?? string.Empty,
        [.. checks.OrderBy(c => c.Kind).Select(c => new SubmissionCheckDto(
            c.Kind.ToString(),
            c.Outcome.ToString().ToLowerInvariant(),
            c.Outcome == CheckOutcome.Pending ? "Checking…" : c.Message))]);

    private static string Where(Event e) => e.Format == EventFormat.Streaming
        ? "Streaming online"
        : e.Venue is null || string.IsNullOrWhiteSpace(e.Venue.Address)
            ? "Address not given"
            : $"{e.Venue.Name}, {e.Venue.Address}, {e.Venue.City}";

    private async Task<string> SummaryAsync(List<Event> waiting, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (waiting.Count == 0)
        {
            var last = await db.ModerationDecisions.AsNoTracking()
                .Where(d => d.Kind == DecisionKind.Approved && d.UndoneAtUtc == null)
                .Select(d => (DateTimeOffset?)d.DecidedAtUtc)
                .ToListAsync(cancellationToken);
            var newest = last.Max();
            return newest is null ? "0 waiting" : $"0 waiting · last approval {Relative(newest.Value, now, capitalise: false)}";
        }

        var summary = $"{waiting.Count} waiting · oldest submitted {Relative(waiting[0].SubmittedAtUtc ?? now, now, capitalise: false)}";
        var median = await MedianReviewTimeAsync(now, cancellationToken);
        return median is null ? summary : $"{summary} · median review time {median}";
    }

    /// <summary>Median of decided − submitted over the last 30 days' decisions that were not undone.</summary>
    private async Task<string?> MedianReviewTimeAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var since = now.AddDays(-30);
        var rows = await db.ModerationDecisions.AsNoTracking()
            .Where(d => d.UndoneAtUtc == null && d.DecidedAtUtc > since)
            .Select(d => new { d.DecidedAtUtc, d.Event!.SubmittedAtUtc })
            .ToListAsync(cancellationToken);
        var durations = rows.Where(r => r.SubmittedAtUtc is not null)
            .Select(r => r.DecidedAtUtc - r.SubmittedAtUtc!.Value)
            .OrderBy(d => d)
            .ToList();
        if (durations.Count == 0)
        {
            return null;
        }

        var mid = durations.Count / 2;
        var median = durations.Count % 2 == 1 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2;
        return median < TimeSpan.FromHours(1)
            ? $"{Math.Max(1, (int)Math.Round(median.TotalMinutes))} min"
            : $"{(int)Math.Round(median.TotalHours)} h";
    }

    /// <summary>"just now", "12 minutes ago", "2 hours ago" (same Toronto day), "yesterday", or "Oct 30".</summary>
    public static string Relative(DateTimeOffset then, DateTimeOffset now, bool capitalise)
    {
        var elapsed = now - then;
        string text;
        if (elapsed < TimeSpan.FromMinutes(1))
        {
            text = "just now";
        }
        else if (elapsed < TimeSpan.FromHours(1))
        {
            var m = (int)elapsed.TotalMinutes;
            text = m == 1 ? "1 minute ago" : $"{m} minutes ago";
        }
        else if (TorontoTime.Today(then) == TorontoTime.Today(now))
        {
            var h = (int)elapsed.TotalHours;
            text = h == 1 ? "1 hour ago" : $"{h} hours ago";
        }
        else if (TorontoTime.Today(then) == TorontoTime.Today(now).AddDays(-1))
        {
            text = "yesterday";
        }
        else
        {
            text = (capitalise ? string.Empty : "on ") + TorontoTime.Today(then).ToString("MMM d", En);
        }

        return capitalise ? char.ToUpperInvariant(text[0]) + text[1..] : text;
    }
}
