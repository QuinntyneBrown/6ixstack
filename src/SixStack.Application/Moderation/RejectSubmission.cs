using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Moderation;

public sealed record EmailPreviewDto(string To, string Subject, string Body);

public sealed record RejectionResultDto(Guid EventId, string Title, string OrganizerName, string Status, EmailPreviewDto EmailPreview);

/// <summary>Rejects a submission with a reason the organizer sees, and an optional message (L2-061).</summary>
public sealed record RejectSubmissionCommand(Guid EventId, string? Reason, string? Message) : IRequest<RejectionResultDto>
{
    public static readonly Dictionary<string, RejectionReason> Reasons = Enum.GetValues<RejectionReason>()
        .ToDictionary(r => JsonNamingPolicy.CamelCase.ConvertName(r.ToString()));

    public static readonly Dictionary<RejectionReason, string> Labels = new()
    {
        [RejectionReason.MissingVenueAddress] = "Missing or unclear venue address",
        [RejectionReason.NotDeveloperEvent] = "Not a developer event",
        [RejectionReason.Duplicate] = "Duplicate of an existing listing",
        [RejectionReason.SpamOrAdvertising] = "Spam or advertising",
        [RejectionReason.CodeOfConduct] = "Breaks the code of conduct",
    };
}

public sealed class RejectSubmissionCommandValidator : AbstractValidator<RejectSubmissionCommand>
{
    public RejectSubmissionCommandValidator()
    {
        RuleFor(c => c.Reason)
            .Must(r => r is not null && RejectSubmissionCommand.Reasons.ContainsKey(r))
            .WithMessage("Choose a reason. The organizer sees it in their email.");
        RuleFor(c => c.Message).MaximumLength(1000).WithMessage("Keep the message to 1,000 characters or fewer.");
    }
}

/// <summary>
/// Applies the reason rule, records the decision and audit entry, emails the sender at once (no undo) and leaves them an
/// in-app notification (L2-061, L2-066, L2-086). The first decision wins (L2-063).
/// </summary>
public sealed class RejectSubmissionCommandHandler(
    IAppDbContext db,
    IClock clock,
    ICurrentUser user,
    IOutbox outbox,
    IAuditLog audit,
    Notifications.EmailPolicy emails,
    IOptions<SiteOptions> site) : IRequestHandler<RejectSubmissionCommand, RejectionResultDto>
{
    public async Task<RejectionResultDto> Handle(RejectSubmissionCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var reason = RejectSubmissionCommand.Reasons[request.Reason!];
        var message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim();
        var e = await db.Events.Include(x => x.Community).SingleOrDefaultAsync(x => x.Id == request.EventId, cancellationToken)
            ?? throw new NotFoundException("No such submission.");
        await ModerationConflicts.ThrowIfDecidedAsync(db, e, cancellationToken);

        e.Decline(reason);
        var needsChanges = e.Status == EventStatus.NeedsChanges;
        db.ModerationDecisions.Add(new ModerationDecision
        {
            EventId = e.Id,
            ModeratorId = user.UserId,
            Kind = needsChanges ? DecisionKind.RequestChanges : DecisionKind.Rejected,
            Reason = reason,
            Message = message,
            DecidedAtUtc = now,
        });
        audit.Record("SubmissionRejected", nameof(Event), e.Id);

        var label = RejectSubmissionCommand.Labels[reason];
        var subject = needsChanges ? $"“{e.Title}” needs changes" : $"“{e.Title}” wasn’t approved";
        var body = string.Join("\n\n", new[]
        {
            $"A moderator reviewed “{e.Title}”.",
            $"Reason: {label.ToLowerInvariant()}.",
            message is null ? null : $"“{message}”",
            needsChanges
                ? $"Edit it and resubmit: {site.Value.PublicBaseUrl.TrimEnd('/')}/organize"
                : "We won’t list it on 6ixstack.",
        }.Where(p => p is not null));
        var to = e.SubmitterEmail ?? string.Empty;
        if (to.Length > 0)
        {
            // A rejection is always emailed (L2-061); a send-back follows the event-decisions switch (L2-067).
            if (!needsChanges || await emails.WantsAsync(to, p => p.EventDecisions, cancellationToken))
            {
                outbox.Enqueue(new SendEmail(new EmailMessage(to, subject, body)));
            }

            db.Notifications.Add(new Notification
            {
                RecipientEmail = to,
                Title = subject,
                Text = $"Reason: {label.ToLowerInvariant()}." + (needsChanges ? " Edit it and resubmit." : string.Empty),
                Link = "/organize",
                Tone = "danger",
                CreatedAtUtc = now,
            });
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DecisionConflictException("decided", null);
        }

        return new RejectionResultDto(
            e.Id,
            e.Title,
            e.Community?.Name ?? e.OrganizerName ?? string.Empty,
            needsChanges ? "needsChanges" : "rejected",
            new EmailPreviewDto(to, subject, body));
    }
}
