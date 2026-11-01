using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.EventAdmin;

/// <summary><c>events delete</c> (L2-109): a soft delete; with <c>Apply</c> false it checks and previews.</summary>
public sealed record DeleteAdminEventCommand(string IdOrSlug, Guid? IfVersion, bool Apply) : IRequest<AdminWriteResultDto>;

/// <summary>Sets the status to Deleted and records <c>EventDeleted</c> with the previous status, in one commit (L2-112).</summary>
public sealed class DeleteAdminEventCommandHandler(IAppDbContext db, IAuditLog audit) : IRequestHandler<DeleteAdminEventCommand, AdminWriteResultDto>
{
    public async Task<AdminWriteResultDto> Handle(DeleteAdminEventCommand request, CancellationToken cancellationToken)
    {
        var e = await AdminEventLookup.FindAsync(db.Events.Include(x => x.Community), request.IdOrSlug, cancellationToken);
        if (e.Status == EventStatus.Deleted)
        {
            throw new EditConflictException("deleted", "This event is already deleted.");
        }

        if (request.IfVersion is { } version && version != e.Version)
        {
            throw new EditConflictException("changed", "Someone else changed this event.");
        }

        var previous = AdminEventStatus.Name(e.Status);
        if (!request.Apply)
        {
            return new AdminWriteResultDto("deleted", true, ["status"], AdminEventSummaryDto.From(e));
        }

        e.Delete();
        audit.Record("EventDeleted", nameof(Event), e.Id, $"was {previous}");
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new EditConflictException("changed", "Someone else changed this event.");
        }

        return new AdminWriteResultDto("deleted", false, ["status"], AdminEventSummaryDto.From(e));
    }
}
