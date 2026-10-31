using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Identity;

/// <summary>Redeems a verification link; returns false for an unknown, used or expired one.</summary>
public sealed record VerifyEmailCommand(string Token) : IRequest<bool>;

/// <summary>
/// Marks the address verified and publishes the events from it that a moderator already approved, at that moment
/// (L2-085).
/// </summary>
public sealed class VerifyEmailCommandHandler(IAppDbContext db, IClock clock, ISecurityTokenService tokens) : IRequestHandler<VerifyEmailCommand, bool>
{
    public async Task<bool> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var hash = tokens.Hash(request.Token);
        var token = await db.SecurityTokens.SingleOrDefaultAsync(t => t.TokenHash == hash && t.Purpose == SecurityTokenPurpose.VerifyEmail, cancellationToken);
        if (token is null || !token.IsUsable(now))
        {
            return false;
        }

        token.UsedAtUtc = now;
        if (!await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == token.Email, cancellationToken))
        {
            db.VerifiedEmails.Add(new VerifiedEmail { NormalizedEmail = token.Email, VerifiedAtUtc = now });
        }

        var approved = await db.Events
            .Where(e => e.SubmitterEmail == token.Email && e.Status == EventStatus.InReview && e.ApprovedAtUtc != null)
            .ToListAsync(cancellationToken);
        foreach (var e in approved)
        {
            e.Status = EventStatus.Published;
            e.PublishedAtUtc = now;
            db.Notifications.Add(Moderation.LiveNotification.For(e, now));
        }

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
