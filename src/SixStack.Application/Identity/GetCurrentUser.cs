using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Application.Identity;

/// <summary>What the signed-in header needs (L2-050), with the unread notification count (L2-065).</summary>
public sealed record CurrentUserDto(string Name, string Email, string Initials, string Role, int UnreadNotificationCount);

public sealed record GetCurrentUserQuery : IRequest<CurrentUserDto?>;

public sealed class GetCurrentUserQueryHandler(IAppDbContext db, ICurrentUser current) : IRequestHandler<GetCurrentUserQuery, CurrentUserDto?>
{
    public async Task<CurrentUserDto?> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (current.UserId is not { } id)
        {
            return null;
        }

        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var unread = await db.Notifications.CountAsync(n => n.RecipientEmail == user.Email && n.ReadAtUtc == null, cancellationToken);
        return new CurrentUserDto(user.Name ?? user.Email, user.Email, user.Initials, user.Role.ToString().ToLowerInvariant(), unread);
    }
}
