using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Application.EventAdmin;

/// <summary><c>events get</c> (L2-106): any status, including Deleted; the submitter email only when asked (L2-113).</summary>
public sealed record GetAdminEventQuery(string IdOrSlug, bool IncludeContact = false) : IRequest<AdminEventDto>;

public sealed class GetAdminEventQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetAdminEventQuery, AdminEventDto>
{
    public async Task<AdminEventDto> Handle(GetAdminEventQuery request, CancellationToken cancellationToken)
    {
        var e = await AdminEventLookup.FindAsync(db.Events.AsNoTracking().Include(x => x.Community), request.IdOrSlug, cancellationToken);
        return AdminEventDto.From(e, clock.UtcNow, request.IncludeContact);
    }
}
