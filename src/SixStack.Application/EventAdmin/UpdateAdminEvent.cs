using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Organizer;
using SixStack.Domain.Enums;

namespace SixStack.Application.EventAdmin;

/// <summary>
/// <c>events update</c> (L2-108): the patch over the event's current form values. With <c>Apply</c> false it checks
/// and previews; with <c>Apply</c> true it saves through <see cref="UpdateOrganizerEventCommand"/>, the moderator
/// edit path (L2-054, L2-062), which records <c>EventEdited</c>.
/// </summary>
public sealed record UpdateAdminEventCommand(string IdOrSlug, EventDetailsPatch Patch, Guid? IfVersion, bool Apply) : IRequest<AdminWriteResultDto>;

public sealed class UpdateAdminEventCommandHandler(IAppDbContext db, IClock clock, ISender sender, IValidator<UpdateOrganizerEventCommand> validator)
    : IRequestHandler<UpdateAdminEventCommand, AdminWriteResultDto>
{
    public async Task<AdminWriteResultDto> Handle(UpdateAdminEventCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var events = db.Events.AsNoTracking().Include(x => x.Community).Where(x => x.Status != EventStatus.Deleted);
        var e = await AdminEventLookup.FindAsync(events, request.IdOrSlug, cancellationToken);
        if (request.IfVersion is { } version && version != e.Version)
        {
            throw new EditConflictException("changed", "Someone else changed this event.");
        }

        if (e.IsPast(now))
        {
            throw new EditConflictException("read-only", "This event has ended, so it can’t be edited.");
        }

        if (e.IsCancelled)
        {
            throw new EditConflictException("read-only", "This event is cancelled, so it can’t be edited.");
        }

        var before = GetOrganizerEventQueryHandler.ToDto(e, now, 0).Details;
        var after = request.Patch.ApplyTo(before);
        var command = new UpdateOrganizerEventCommand(
            e.Id, after.Title, after.OrganizerName, after.Description, after.Topics, after.Date, after.TimeZoneId, after.StartTime,
            after.EndTime, after.Format, after.VenueName, after.City, after.StreetAddress, after.StreamUrl, after.IsFree,
            after.PriceCad, after.TicketUrl);
        await validator.ValidateAndThrowAsync(command, cancellationToken);
        var changes = EventDetailsPatch.ChangedFields(before, after);
        if (!request.Apply)
        {
            return new AdminWriteResultDto("updated", true, changes, AdminEventSummaryDto.From(e));
        }

        await sender.Send(command, cancellationToken);
        var saved = await db.Events.AsNoTracking().Include(x => x.Community).SingleAsync(x => x.Id == e.Id, cancellationToken);
        return new AdminWriteResultDto("updated", false, changes, AdminEventSummaryDto.From(saved));
    }
}
