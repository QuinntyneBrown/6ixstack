using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Application.ApiTokens;

/// <summary>The current moderator's API tokens, newest first, without any secret (L2-120, L2-124).</summary>
public sealed record ListApiTokensQuery : IRequest<ApiTokenListDto>;

public sealed class ListApiTokensQueryHandler(IAppDbContext db, IClock clock, ICurrentUser user) : IRequestHandler<ListApiTokensQuery, ApiTokenListDto>
{
    public async Task<ApiTokenListDto> Handle(ListApiTokensQuery request, CancellationToken cancellationToken)
    {
        var ownerId = await ApiTokenOwner.ModeratorIdAsync(db, user, cancellationToken);
        var now = clock.UtcNow;
        var rows = await db.ApiTokens.AsNoTracking().Where(t => t.UserId == ownerId).ToListAsync(cancellationToken);
        var tokens = rows.OrderByDescending(t => t.CreatedAtUtc).ThenBy(t => t.Name).Select(t => ApiTokenDto.From(t, now)).ToList();
        return new ApiTokenListDto(tokens.Count, tokens);
    }
}
