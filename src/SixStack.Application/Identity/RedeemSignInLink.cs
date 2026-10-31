using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Identity;

/// <summary>The signed-in identity to put in the cookie, and where to send the browser.</summary>
public sealed record SignedIn(Guid SessionId, Guid UserId, string Email, string Name, UserRole Role, string RedirectTo);

/// <summary>Redeems a sign-in link; null when it is unknown, used or expired (L2-047, L2-084).</summary>
public sealed record RedeemSignInLinkCommand(string Token) : IRequest<SignedIn?>;

/// <summary>
/// Marks the token used, finds or creates the user, and starts a session, all in one unit of work, so a token can
/// start at most one session.
/// </summary>
public sealed class RedeemSignInLinkCommandHandler(IAppDbContext db, IClock clock, ISecurityTokenService tokens)
    : IRequestHandler<RedeemSignInLinkCommand, SignedIn?>
{
    public async Task<SignedIn?> Handle(RedeemSignInLinkCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var hash = tokens.Hash(request.Token);
        var token = await db.SecurityTokens.SingleOrDefaultAsync(t => t.TokenHash == hash && t.Purpose == SecurityTokenPurpose.SignIn, cancellationToken);
        if (token is null || !token.IsUsable(now))
        {
            return null;
        }

        token.UsedAtUtc = now;
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == token.Email, cancellationToken);
        if (user is null)
        {
            user = User.CreateOrganizer(token.Email, now);
            db.Users.Add(user);
        }

        var session = Session.Start(user.Id, now);
        db.Sessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);

        var home = user.Role == UserRole.Moderator ? "/admin/review" : "/organize";
        return new SignedIn(session.Id, user.Id, user.Email, user.Name ?? user.Email, user.Role, token.ReturnUrl ?? home);
    }
}

/// <summary>Starts a session for an existing user; the test sign-in seam uses it (ADR 0002, ADR 0009).</summary>
public sealed record StartSessionCommand(string Email) : IRequest<SignedIn?>;

public sealed class StartSessionCommandHandler(IAppDbContext db, IClock clock) : IRequestHandler<StartSessionCommand, SignedIn?>
{
    public async Task<SignedIn?> Handle(StartSessionCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var session = Session.Start(user.Id, clock.UtcNow);
        db.Sessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);
        return new SignedIn(session.Id, user.Id, user.Email, user.Name ?? user.Email, user.Role, "/");
    }
}
