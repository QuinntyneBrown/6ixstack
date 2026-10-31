using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Application.Events;

public sealed record GetEventDetailQuery(string Slug) : IRequest<EventDetailDto>;

/// <summary>One published event by slug; unknown or unpublished events are not found (L2-024).</summary>
public sealed class GetEventDetailQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetEventDetailQuery, EventDetailDto>
{
    public async Task<EventDetailDto> Handle(GetEventDetailQuery request, CancellationToken cancellationToken)
    {
        var e = await db.Events.AsNoTracking()
            .Include(x => x.Community)
            .Include(x => x.Speakers).ThenInclude(s => s.Speaker)
            .SingleOrDefaultAsync(x => x.Slug == request.Slug && x.Status == EventStatus.Published, cancellationToken)
            ?? throw new NotFoundException($"Event {request.Slug} was not found");

        var now = clock.UtcNow;
        var next = e.IsPast(now) && !e.IsCancelled
            ? await db.Events.AsNoTracking()
                .Where(x => x.CommunityId == e.CommunityId && x.Status == EventStatus.Published && x.CancelledAtUtc == null && x.StartsAtUtc >= now)
                .OrderBy(x => x.StartsAtUtc)
                .FirstOrDefaultAsync(cancellationToken)
            : null;

        return EventDetailPolicy.Build(e, next, now);
    }
}
