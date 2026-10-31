using SixStack.Application.Common.Messages;
using SixStack.Application.Calendar;
using Microsoft.Extensions.Options;
using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Moderation;

public sealed record PossibleDuplicateDto(Guid EventId, string Slug, string DateLabel);

public sealed record ApprovalResultDto(
    Guid EventId,
    string Title,
    string OrganizerName,
    Guid DecisionId,
    DateTimeOffset UndoDeadlineUtc,
    bool IsPublished,
    PossibleDuplicateDto? PossibleDuplicate);

/// <summary>Approves a submission (L2-060): published now, or once the sender verifies (L2-085). First decision wins (L2-063).</summary>
public sealed record ApproveSubmissionCommand(Guid EventId) : IRequest<ApprovalResultDto>;

/// <summary>Sent after the undo window: tells the organizer their event is live, unless the approval was undone.</summary>
public sealed record SubmissionApprovedNotification(Guid DecisionId);

public sealed class ApproveSubmissionCommandHandler(
    IAppDbContext db,
    IClock clock,
    ICurrentUser user,
    IOutbox outbox,
    IAuditLog audit) : IRequestHandler<ApproveSubmissionCommand, ApprovalResultDto>
{
    public static readonly TimeSpan UndoWindow = TimeSpan.FromSeconds(8);
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<ApprovalResultDto> Handle(ApproveSubmissionCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var e = await db.Events.Include(x => x.Community).SingleOrDefaultAsync(x => x.Id == request.EventId, cancellationToken)
            ?? throw new NotFoundException("No such submission.");
        await ModerationConflicts.ThrowIfDecidedAsync(db, e, cancellationToken);

        var verified = e.SubmitterEmail is not null && await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == e.SubmitterEmail, cancellationToken);
        e.Approve(now, verified);
        var decision = new ModerationDecision { EventId = e.Id, ModeratorId = user.UserId, Kind = DecisionKind.Approved, DecidedAtUtc = now };
        db.ModerationDecisions.Add(decision);
        audit.Record("SubmissionApproved", nameof(Event), e.Id);
        if (verified)
        {
            outbox.Enqueue(new SubmissionApprovedNotification(decision.Id), now + UndoWindow);
        }

        var duplicate = await DuplicateAsync(e.Id, cancellationToken);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DecisionConflictException("approved", null);
        }

        return new ApprovalResultDto(e.Id, e.Title, e.Community?.Name ?? e.OrganizerName ?? string.Empty, decision.Id, now + UndoWindow, verified, duplicate);
    }

    private async Task<PossibleDuplicateDto?> DuplicateAsync(Guid eventId, CancellationToken cancellationToken)
    {
        var related = await db.SubmissionChecks.AsNoTracking()
            .Where(c => c.EventId == eventId && c.Kind == CheckKind.Duplicate && c.Outcome == CheckOutcome.Warning && c.RelatedEventId != null)
            .Select(c => c.RelatedEventId)
            .FirstOrDefaultAsync(cancellationToken);
        if (related is null)
        {
            return null;
        }

        var other = await db.Events.AsNoTracking().Where(x => x.Id == related).Select(x => new { x.Id, x.Slug, x.StartsAtUtc }).SingleOrDefaultAsync(cancellationToken);
        return other is null ? null : new PossibleDuplicateDto(other.Id, other.Slug, TorontoTime.ToLocal(other.StartsAtUtc).ToString("MMM d", En));
    }
}

/// <summary>Undoes an approval within 8 s of it (L2-060); later, the approval stands.</summary>
public sealed record UndoApprovalCommand(Guid EventId) : IRequest;

public sealed class UndoApprovalCommandHandler(IAppDbContext db, IClock clock, IAuditLog audit) : IRequestHandler<UndoApprovalCommand>
{
    public async Task Handle(UndoApprovalCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var e = await db.Events.SingleOrDefaultAsync(x => x.Id == request.EventId, cancellationToken)
            ?? throw new NotFoundException("No such submission.");
        var decision = await db.ModerationDecisions
            .Where(d => d.EventId == e.Id && d.Kind == DecisionKind.Approved && d.UndoneAtUtc == null)
            .OrderByDescending(d => d.DecidedAtUtc)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new DecisionConflictException("in review", null, "nothing-to-undo");
        if (now > decision.DecidedAtUtc + ApproveSubmissionCommandHandler.UndoWindow)
        {
            throw new DecisionConflictException("approved", null, "too-late");
        }

        e.UndoApproval();
        decision.UndoneAtUtc = now;
        audit.Record("ApprovalUndone", nameof(Event), e.Id);
        await db.SaveChangesAsync(cancellationToken);
    }
}

public static class ModerationConflicts
{
    /// <summary>Refuses a decision on a submission someone already decided, naming them (L2-063).</summary>
    public static async Task ThrowIfDecidedAsync(IAppDbContext db, Event e, CancellationToken cancellationToken)
    {
        var active = await db.ModerationDecisions.AsNoTracking()
            .Where(d => d.EventId == e.Id && d.UndoneAtUtc == null)
            .OrderByDescending(d => d.DecidedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
        if (active is null && e.Status == EventStatus.InReview && e.ApprovedAtUtc is null)
        {
            return;
        }

        var name = active?.ModeratorId is { } moderatorId
            ? await db.Users.Where(u => u.Id == moderatorId).Select(u => u.Name ?? u.Email).SingleOrDefaultAsync(cancellationToken)
            : null;
        var decision = (active?.Kind, e.Status) switch
        {
            (DecisionKind.Rejected, _) or (_, EventStatus.Rejected) => "rejected",
            (DecisionKind.RequestChanges, _) or (_, EventStatus.NeedsChanges) => "sent back",
            _ => "approved",
        };
        throw new DecisionConflictException(decision, name?.Split(' ')[0]);
    }
}

/// <summary>After the undo window: the in-app notification, then the email when event decisions are on (L2-066, L2-067).</summary>
public sealed class SubmissionApprovedNotificationHandler(IAppDbContext db, IClock clock, IOutbox outbox, Notifications.EmailPolicy emails, IOptions<SiteOptions> site)
    : IOutboxMessageHandler<SubmissionApprovedNotification>
{
    public async Task HandleAsync(SubmissionApprovedNotification message, CancellationToken cancellationToken)
    {
        var decision = await db.ModerationDecisions.Include(d => d.Event).SingleOrDefaultAsync(d => d.Id == message.DecisionId, cancellationToken);
        if (decision?.Event is not { Status: EventStatus.Published, SubmitterEmail: not null } e || decision.UndoneAtUtc is not null)
        {
            return;
        }

        db.Notifications.Add(LiveNotification.For(e, clock.UtcNow));
        if (await emails.WantsAsync(e.SubmitterEmail, p => p.EventDecisions, cancellationToken))
        {
            // A separate outbox message, so a failed send is retried and never takes the notification with it.
            outbox.Enqueue(new SendEmail(new EmailMessage(
                e.SubmitterEmail,
                $"“{e.Title}” is live",
                $"Good news: a moderator approved “{e.Title}”. It’s in the 6ixstack list, the calendar and every matching feed.\n\nSee it: {site.Value.PublicBaseUrl.TrimEnd('/')}/events/{e.Slug}")));
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}

public static class LiveNotification
{
    /// <summary>"“{title}” is live", linking to the event (L2-066).</summary>
    public static Notification For(Event e, DateTimeOffset now) => new()
    {
        RecipientEmail = e.SubmitterEmail!,
        Title = $"“{e.Title}” is live",
        Link = $"/events/{e.Slug}",
        CreatedAtUtc = now,
    };
}
