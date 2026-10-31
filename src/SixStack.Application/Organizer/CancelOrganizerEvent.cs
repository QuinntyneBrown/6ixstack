using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;

namespace SixStack.Application.Organizer;

/// <summary>The cancel dialog's request (L2-056); <c>ConfirmationName</c> is required for high-impact events.</summary>
public sealed record CancelOrganizerEventCommand(Guid Id, string? Reason, bool NotifyAttendees, string? ConfirmationName)
    : IRequest<EventCancelledDto>;

public sealed record EventCancelledDto(string Title, string Status, DateTimeOffset CancelledAtUtc, int EmailsQueued);

public sealed class CancelOrganizerEventCommandValidator : AbstractValidator<CancelOrganizerEventCommand>
{
    public const int MaxReasonLength = 500;

    public CancelOrganizerEventCommandValidator()
    {
        RuleFor(c => c.Reason).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Tell attendees why, in a sentence or two.")
            .MaximumLength(MaxReasonLength).WithMessage("Keep the reason to 500 characters or fewer.");
    }
}

/// <summary>
/// Cancels the event for someone who may edit it, re-checks the typed name of a paid or busy event, records the audit
/// entry and, when asked, queues the reason to every person going that the attendee directory knows.
/// </summary>
public sealed class CancelOrganizerEventCommandHandler(
    IAppDbContext db,
    IClock clock,
    EventAccess access,
    IAuditLog audit,
    IOutbox outbox,
    IAttendeeDirectory attendees,
    IOptions<SiteOptions> site) : IRequestHandler<CancelOrganizerEventCommand, EventCancelledDto>
{
    /// <summary>Paid events and events with this many going need the name typed (L2-056).</summary>
    public const int HighImpactGoing = 100;

    public static bool IsHighImpact(Event e) => e.PriceCents > 0 || e.GoingCount >= HighImpactGoing;

    public async Task<EventCancelledDto> Handle(CancelOrganizerEventCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var e = await db.Events.Include(x => x.Community).SingleOrDefaultAsync(x => x.Id == request.Id && x.Status != Domain.Enums.EventStatus.Deleted, cancellationToken)
            ?? throw new NotFoundException("Event not found.");
        await access.DemandAsync(e, cancellationToken);
        if (e.IsPast(now) || e.IsCancelled)
        {
            throw new EditConflictException("read-only", "This event can’t be cancelled.");
        }

        if (IsHighImpact(e) && !string.Equals(request.ConfirmationName?.Trim(), e.Title, StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException([new ValidationFailure(nameof(request.ConfirmationName), "Type the event name to confirm.")]);
        }

        var reason = request.Reason!.Trim();
        e.Cancel(reason, now);
        audit.Record("EventCancelled", nameof(Event), e.Id);
        var recipients = request.NotifyAttendees ? await attendees.EmailsGoingToAsync(e.Id, cancellationToken) : [];
        var organizer = e.Community?.Name ?? e.OrganizerName ?? "The organizer";
        var when = $"{TorontoTime.ToLocal(e.StartsAtUtc):dddd, MMMM d} at {TorontoTime.Time(e.StartsAtUtc)}";
        foreach (var email in recipients)
        {
            outbox.Enqueue(new SendEmail(new EmailMessage(
                email,
                $"“{e.Title}” is cancelled",
                $"{organizer} cancelled “{e.Title}”, planned for {when}.\n\n“{reason}”\n\n{site.Value.PublicBaseUrl.TrimEnd('/')}/events/{e.Slug}")));
        }

        await db.SaveChangesAsync(cancellationToken);
        return new EventCancelledDto(e.Title, "cancelled", now, recipients.Count);
    }
}
