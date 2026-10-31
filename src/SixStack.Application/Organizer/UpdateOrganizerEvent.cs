using SixStack.Application.Common.Messages;
using SixStack.Application.Calendar;
using Microsoft.Extensions.Options;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Moderation;
using SixStack.Application.Submissions;
using SixStack.Domain.Enums;

namespace SixStack.Application.Organizer;

/// <summary>Saved details from the edit page (L2-054); the body matches <see cref="EventDetailsFormDto"/>.</summary>
public sealed record UpdateOrganizerEventCommand(
    Guid Id,
    string? Title,
    string? OrganizerName,
    string? Description,
    IReadOnlyList<string>? Topics,
    string? Date,
    string? TimeZoneId,
    string? StartTime,
    string? EndTime,
    string? Format,
    string? VenueName,
    string? City,
    string? StreetAddress,
    string? StreamUrl,
    bool IsFree,
    decimal? PriceCad,
    string? TicketUrl) : IRequest<EventSavedDto>, IEventDetailsInput;

public sealed record EventSavedDto(string Slug, string Title, string Status, int GoingCount, bool Resubmitted);

public sealed class UpdateOrganizerEventCommandValidator(IClock clock) : EventDetailsValidator<UpdateOrganizerEventCommand>(clock);

/// <summary>
/// Applies the edit: access first, then the details, then the status rule (an organizer's save of a Needs changes or
/// Rejected event resubmits it; a moderator's save never changes the status), an audit entry and one commit.
/// </summary>
public sealed class UpdateOrganizerEventCommandHandler(
    IAppDbContext db,
    IClock clock,
    EventAccess access,
    IAuditLog audit,
    ISubmissionCheckScheduler checks,
    ICurrentUser current,
    IOutbox outbox,
    Notifications.EmailPolicy emails,
    IOptions<SiteOptions> site) : IRequestHandler<UpdateOrganizerEventCommand, EventSavedDto>
{
    public async Task<EventSavedDto> Handle(UpdateOrganizerEventCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var e = await db.Events.Include(x => x.Community).SingleOrDefaultAsync(x => x.Id == request.Id && x.Status != EventStatus.Deleted, cancellationToken)
            ?? throw new NotFoundException("Event not found.");
        await access.DemandAsync(e, cancellationToken);
        if (e.IsPast(now) || e.IsCancelled)
        {
            throw new EditConflictException("read-only", "This event has ended, so it can’t be edited.");
        }

        var changed = e.Edit(((IEventDetailsInput)request).ToDetails(), now);
        var resubmitted = !access.IsModerator && e.Status is EventStatus.NeedsChanges or EventStatus.Rejected;
        if (resubmitted)
        {
            e.Resubmit();
            await checks.ScheduleAsync(e, cancellationToken);
        }

        audit.Record("EventEdited", nameof(Domain.Entities.Event), e.Id, string.Join(", ", changed));
        if (access.IsModerator && changed.Count > 0 && e.SubmitterEmail is { } owner
            && await emails.WantsAsync(owner, p => p.EventDecisions, cancellationToken))
        {
            var moderator = await db.Users.Where(u => u.Id == current.UserId).Select(u => u.Name ?? "A moderator").SingleAsync(cancellationToken);
            var what = string.Join(", ", changed.Select(FieldLabel).Distinct());
            outbox.Enqueue(new SendEmail(new EmailMessage(
                owner,
                $"A moderator updated “{e.Title}”",
                $"{moderator.Split(' ')[0]} from 6ixstack updated “{e.Title}”: {what}.\n\nCheck your event: {site.Value.PublicBaseUrl.TrimEnd('/')}/organize\n\nReply to this email if something looks wrong.")));
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new EditConflictException("changed", "Someone else changed this event.");
        }

        return new EventSavedDto(e.Slug, e.Title, GetOrganizerEventQueryHandler.StatusName(e, now), e.GoingCount, resubmitted);
    }

    /// <summary>The words for a changed field in the "a moderator updated" email.</summary>
    private static string FieldLabel(string field) => field switch
    {
        "organizerName" => "organizer",
        "startTime" => "start time",
        "endTime" => "end time",
        "timeZoneId" => "time zone",
        "venueName" => "venue",
        "streetAddress" => "address",
        "streamUrl" => "livestream link",
        "priceCad" => "price",
        "ticketUrl" => "ticket link",
        _ => field,
    };
}
