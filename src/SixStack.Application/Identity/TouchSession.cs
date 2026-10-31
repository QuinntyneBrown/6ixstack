using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Application.Identity;

/// <summary>Checks a session on each request: active, and its last-seen time advanced at most every 5 minutes.</summary>
public sealed record TouchSessionCommand(Guid SessionId) : IRequest<bool>;

public sealed class TouchSessionCommandHandler(IAppDbContext db, IClock clock) : IRequestHandler<TouchSessionCommand, bool>
{
    public static readonly TimeSpan TouchInterval = TimeSpan.FromMinutes(5);

    public async Task<bool> Handle(TouchSessionCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var session = await db.Sessions.SingleOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);
        if (session is null || !session.IsActive(now))
        {
            return false;
        }

        if (now - session.LastSeenAtUtc >= TouchInterval)
        {
            session.LastSeenAtUtc = now;
            await db.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
