using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Application.Identity;

/// <summary>Deletes the signed-in account once its email is typed, ignoring case and surrounding spaces (L2-071).</summary>
public sealed record DeleteAccountCommand(string? ConfirmationEmail) : IRequest;

/// <summary>
/// Removes the account and its personal data at once (L2-100 allows 30 days): the user, sessions, sign-in tokens,
/// verification, notifications and organizer memberships; the address is cleared from submitted events, which stay
/// under their community. The audit entry keeps the account id and no email.
/// </summary>
public sealed class DeleteAccountCommandHandler(IAppDbContext db, ICurrentUser current, IAuditLog audit) : IRequestHandler<DeleteAccountCommand>
{
    public async Task Handle(DeleteAccountCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.Include(u => u.Communities).SingleAsync(u => u.Id == current.UserId, cancellationToken);
        if (!string.Equals(request.ConfirmationEmail?.Trim(), user.Email, StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException([new ValidationFailure(nameof(request.ConfirmationEmail), $"That doesn’t match. Type {user.Email} exactly.")]);
        }

        var email = user.Email;
        var addresses = new[] { email, user.PendingEmail }.Where(a => a is not null).Select(a => a!).ToList();
        db.Sessions.RemoveRange(await db.Sessions.Where(s => s.UserId == user.Id).ToListAsync(cancellationToken));
        db.SecurityTokens.RemoveRange(await db.SecurityTokens.Where(t => addresses.Contains(t.Email)).ToListAsync(cancellationToken));
        db.VerifiedEmails.RemoveRange(await db.VerifiedEmails.Where(v => v.NormalizedEmail == email).ToListAsync(cancellationToken));
        db.Notifications.RemoveRange(await db.Notifications.Where(n => n.RecipientEmail == email).ToListAsync(cancellationToken));
        db.ReviewPresences.RemoveRange(await db.ReviewPresences.Where(p => p.ModeratorId == user.Id).ToListAsync(cancellationToken));
        foreach (var decision in await db.ModerationDecisions.Where(d => d.ModeratorId == user.Id).ToListAsync(cancellationToken))
        {
            decision.ModeratorId = null;
        }

        foreach (var e in await db.Events.Where(e => e.SubmitterEmail == email).ToListAsync(cancellationToken))
        {
            e.SubmitterEmail = null;
        }

        db.CommunityOrganizers.RemoveRange(user.Communities);
        db.Users.Remove(user);
        audit.Record("AccountDeleted", nameof(User), user.Id, "account and personal data removed");
        await db.SaveChangesAsync(cancellationToken);
    }
}
