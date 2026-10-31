using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Application.Moderation;

public sealed record ReviewPresenceDto(IReadOnlyList<string> Others);

/// <summary>Records that the caller is looking at a submission and names the other moderators who are (L2-063).</summary>
public sealed record RecordReviewPresenceCommand(Guid EventId) : IRequest<ReviewPresenceDto>;

public sealed class RecordReviewPresenceCommandHandler(IAppDbContext db, IClock clock, ICurrentUser user)
    : IRequestHandler<RecordReviewPresenceCommand, ReviewPresenceDto>
{
    public async Task<ReviewPresenceDto> Handle(RecordReviewPresenceCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var me = user.UserId!.Value;
        var since = now - ReviewPresence.Timeout;
        db.ReviewPresences.RemoveRange(await db.ReviewPresences.Where(p => p.LastSeenAtUtc < since).ToListAsync(cancellationToken));
        var mine = await db.ReviewPresences.SingleOrDefaultAsync(p => p.EventId == request.EventId && p.ModeratorId == me, cancellationToken);
        if (mine is null)
        {
            db.ReviewPresences.Add(new ReviewPresence { EventId = request.EventId, ModeratorId = me, LastSeenAtUtc = now });
        }
        else
        {
            mine.LastSeenAtUtc = now;
        }

        await db.SaveChangesAsync(cancellationToken);
        var others = await db.ReviewPresences.AsNoTracking()
            .Where(p => p.EventId == request.EventId && p.ModeratorId != me && p.LastSeenAtUtc >= since)
            .Join(db.Users, p => p.ModeratorId, u => u.Id, (_, u) => u.Name ?? u.Email)
            .ToListAsync(cancellationToken);
        return new ReviewPresenceDto([.. others.Select(n => n.Split(' ')[0])]);
    }
}
