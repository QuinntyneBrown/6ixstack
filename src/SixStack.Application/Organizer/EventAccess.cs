using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Organizer;

/// <summary>
/// Who may edit an event (L2-055, L2-062): a moderator, an organizer of its community, or the address that submitted
/// it. Anyone else gets 403 naming the owning community, the event and the signed-in account.
/// </summary>
public sealed class EventAccess(IAppDbContext db, ICurrentUser current)
{
    public bool IsModerator => current.Role == UserRole.Moderator;

    public async Task DemandAsync(Event e, CancellationToken cancellationToken)
    {
        if (IsModerator)
        {
            return;
        }

        var user = await db.Users.AsNoTracking().Include(u => u.Communities).ThenInclude(c => c.Community)
            .SingleAsync(u => u.Id == current.UserId, cancellationToken);
        if ((e.CommunityId is { } id && user.Communities.Any(c => c.CommunityId == id)) || e.SubmitterEmail == user.Email)
        {
            return;
        }

        var owner = e.CommunityId is { } communityId
            ? await db.Communities.Where(c => c.Id == communityId).Select(c => c.Name).SingleAsync(cancellationToken)
            : e.OrganizerName;
        var forbidden = new ForbiddenAccessException("You can't edit this event.");
        forbidden.Extensions["communityName"] = owner;
        forbidden.Extensions["eventTitle"] = e.Title;
        forbidden.Extensions["signedInEmail"] = user.Email;
        forbidden.Extensions["signedInCommunity"] = user.Communities.Select(c => c.Community?.Name).FirstOrDefault();
        throw forbidden;
    }
}
