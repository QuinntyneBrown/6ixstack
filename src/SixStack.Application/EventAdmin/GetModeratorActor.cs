using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Application.EventAdmin;

/// <summary>The moderator account a CLI write acts as (L2-111); anyone else is refused.</summary>
public sealed record GetModeratorActorQuery(string Email) : IRequest<Guid>;

public sealed class GetModeratorActorQueryHandler(IAppDbContext db) : IRequestHandler<GetModeratorActorQuery, Guid>
{
    public async Task<Guid> Handle(GetModeratorActorQuery request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.AsNoTracking().Where(u => u.Email == email).Select(u => new { u.Id, u.Role }).SingleOrDefaultAsync(cancellationToken);
        return user is { Role: UserRole.Moderator }
            ? user.Id
            : throw new ForbiddenAccessException($"{email} is not a moderator account, so it can't change events.");
    }
}
