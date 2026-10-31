using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Application.Identity;

/// <summary>Ends one session (L2-049): other devices stay signed in.</summary>
public sealed record SignOutCommand(Guid SessionId) : IRequest;

public sealed class SignOutCommandHandler(IAppDbContext db, IClock clock, ICurrentUser current) : IRequestHandler<SignOutCommand>
{
    public async Task Handle(SignOutCommand request, CancellationToken cancellationToken)
    {
        var session = await db.Sessions.SingleOrDefaultAsync(s => s.Id == request.SessionId && s.UserId == current.UserId, cancellationToken);
        if (session is { RevokedAtUtc: null })
        {
            session.RevokedAtUtc = clock.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
