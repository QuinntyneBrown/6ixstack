using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Organizer;

public sealed record DashboardStatsDto(int Upcoming, int InReview, int Going, int FeedSubscribers);

public sealed record OrganizerEventRowDto(
    Guid Id,
    string Slug,
    string Title,
    DateTimeOffset StartsAtUtc,
    string DateLabel,
    string Status,
    string StatusLabel,
    int? Going,
    string? NeedsChangesReason,
    string? PublicUrl,
    bool IsPaid,
    int GoingCount,
    int EmailableAttendees);

/// <summary>The newest review outcome for the organizer (L2-053); <c>Key</c> changes with each new outcome.</summary>
public sealed record SubmissionBannerDto(string Kind, string Key, Guid? EventId, string Title, string Text, string? EventSlug, bool Dismissible);

public sealed record OrganizerDashboardDto(
    string? CommunityName,
    string Email,
    DashboardStatsDto Stats,
    IReadOnlyList<OrganizerEventRowDto> Rows,
    SubmissionBannerDto? Banner);

/// <summary>The signed-in organizer's dashboard (L2-051, L2-053).</summary>
public sealed record GetOrganizerDashboardQuery : IRequest<OrganizerDashboardDto>;

/// <summary>
/// The organizer's community's events and any they submitted by email, never another community's; stats; and the
/// banner for the newest outcome, after the unverified-email warning (organizer-dashboard design).
/// </summary>
public sealed class GetOrganizerDashboardQueryHandler(IAppDbContext db, IClock clock, ICurrentUser current, IAttendeeDirectory attendees)
    : IRequestHandler<GetOrganizerDashboardQuery, OrganizerDashboardDto>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    /// <summary>What to fix for each reason that sends an event back (shown under its title).</summary>
    public static readonly Dictionary<RejectionReason, string> Fixes = new() { [RejectionReason.MissingVenueAddress] = "Add the venue address" };

    public async Task<OrganizerDashboardDto> Handle(GetOrganizerDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var user = await db.Users.AsNoTracking().Include(u => u.Communities).ThenInclude(c => c.Community)
            .SingleAsync(u => u.Id == current.UserId, cancellationToken);
        var community = user.Communities.Select(c => c.Community).FirstOrDefault();
        var communityId = community?.Id;
        var events = await db.Events.AsNoTracking()
            .Where(e => e.Status != EventStatus.Deleted && ((communityId != null && e.CommunityId == communityId) || e.SubmitterEmail == user.Email))
            .ToListAsync(cancellationToken);
        events = [.. events.OrderBy(e => e.StartsAtUtc).ThenBy(e => e.Title, StringComparer.Ordinal)];
        var ids = events.Select(e => e.Id).ToList();
        var decisions = await db.ModerationDecisions.AsNoTracking()
            .Where(d => ids.Contains(d.EventId) && d.UndoneAtUtc == null)
            .ToListAsync(cancellationToken);
        var newestDecision = decisions.ToLookup(d => d.EventId);

        var rows = new List<OrganizerEventRowDto>();
        foreach (var e in events)
        {
            var emailable = (await attendees.EmailsGoingToAsync(e.Id, cancellationToken)).Count;
            rows.Add(Row(e, now, newestDecision[e.Id].OrderByDescending(d => d.DecidedAtUtc).FirstOrDefault(), emailable));
        }

        var upcoming = events.Where(e => e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.StartsAtUtc > now).ToList();
        var stats = new DashboardStatsDto(
            upcoming.Count,
            events.Count(e => e.Status == EventStatus.InReview && e.CancelledAtUtc == null),
            upcoming.Sum(e => e.GoingCount),
            community?.FeedSubscriberCount ?? 0);
        var verified = await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == user.Email, cancellationToken);
        var banner = verified ? await OutcomeBannerAsync(events, decisions, cancellationToken) : Unverified(user.Email);
        return new OrganizerDashboardDto(community?.Name, user.Email, stats, rows, banner);
    }

    private static OrganizerEventRowDto Row(Event e, DateTimeOffset now, ModerationDecision? decision, int emailable)
    {
        var (status, label) = e.Status switch
        {
            _ when e.CancelledAtUtc is not null => ("cancelled", "Cancelled"),
            EventStatus.Published when e.EndsAtUtc < now => ("past", "Past"),
            EventStatus.Published => ("published", "Published"),
            EventStatus.InReview => ("inReview", "In review"),
            EventStatus.NeedsChanges => ("needsChanges", "Needs changes"),
            EventStatus.Rejected => ("notApproved", "Not approved"),
            _ => ("draft", "Draft"),
        };
        var isPublic = e.Status == EventStatus.Published;
        return new OrganizerEventRowDto(
            e.Id,
            e.Slug,
            e.Title,
            e.StartsAtUtc,
            $"{TorontoTime.ToLocal(e.StartsAtUtc).ToString("ddd, MMM d", En)} · {TorontoTime.Time(e.StartsAtUtc)}",
            status,
            label,
            isPublic ? e.GoingCount : null,
            e.Status == EventStatus.NeedsChanges && decision?.Reason is { } reason ? Fixes.GetValueOrDefault(reason) : null,
            isPublic ? $"/events/{e.Slug}" : null,
            e.PriceCents > 0,
            e.GoingCount,
            emailable);
    }

    private static SubmissionBannerDto Unverified(string email) => new(
        "unverified",
        "unverified",
        null,
        $"Verify {email} to publish events",
        "Your submissions wait in review until you click the link we sent.",
        null,
        false);

    /// <summary>The newer of the newest decision that was not undone and the newest submission in review.</summary>
    private async Task<SubmissionBannerDto?> OutcomeBannerAsync(List<Event> events, List<ModerationDecision> decisions, CancellationToken cancellationToken)
    {
        var decision = decisions.OrderByDescending(d => d.DecidedAtUtc).FirstOrDefault();
        var waiting = events.Where(e => e.Status == EventStatus.InReview && e.ApprovedAtUtc == null && e.SubmittedAtUtc != null && e.CancelledAtUtc == null)
            .OrderByDescending(e => e.SubmittedAtUtc).FirstOrDefault();
        if (waiting is not null && (decision is null || waiting.SubmittedAtUtc > decision.DecidedAtUtc))
        {
            return new SubmissionBannerDto("inReview", $"inReview:{waiting.Id}", waiting.Id, $"“{waiting.Title}” is in review",
                "Moderators usually reply within a day. We’ll email you either way.", waiting.Slug, true);
        }

        if (decision is null)
        {
            return null;
        }

        var e = events.Single(x => x.Id == decision.EventId);
        var key = $"{decision.Kind}:{decision.Id}";
        switch (decision.Kind)
        {
            case DecisionKind.Approved when e.Status == EventStatus.Published:
                return new SubmissionBannerDto("live", key, e.Id, $"“{e.Title}” is live", "It’s in the list, the calendar and every matching feed.", e.Slug, true);
            case DecisionKind.RequestChanges:
                return new SubmissionBannerDto("needsChanges", key, e.Id, $"“{e.Title}” needs a venue address",
                    "Add the street address and room, then resubmit. It keeps its place in the queue.", e.Slug, true);
            case DecisionKind.Rejected:
                var moderator = decision.ModeratorId is { } id
                    ? await db.Users.AsNoTracking().Where(u => u.Id == id).Select(u => u.Name ?? u.Email).SingleOrDefaultAsync(cancellationToken)
                    : null;
                var quote = decision.Message ?? (decision.Reason is { } r ? Submissions.RejectionText.Label(r) : "It doesn’t fit 6ixstack.");
                return new SubmissionBannerDto("notApproved", key, e.Id, $"“{e.Title}” wasn’t approved",
                    $"“{quote}” — {(moderator ?? "A").Split(' ')[0]}, 6ixstack moderator", e.Slug, true);
            default:
                return null;
        }
    }
}
