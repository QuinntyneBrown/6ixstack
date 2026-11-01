using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Application.ApiTokens;

/// <summary>Revokes one of the current moderator's API tokens (L2-120, L2-124); with <c>Apply</c> false it previews.</summary>
public sealed record RevokeApiTokenCommand(Guid TokenId, bool Apply) : IRequest<ApiTokenWriteResultDto>;

/// <summary>Sets <c>RevokedAtUtc</c> and records <c>ApiTokenRevoked</c> in the same unit of work (L2-122).</summary>
public sealed class RevokeApiTokenCommandHandler(IAppDbContext db, IClock clock, ICurrentUser user, IAuditLog audit)
    : IRequestHandler<RevokeApiTokenCommand, ApiTokenWriteResultDto>
{
    public async Task<ApiTokenWriteResultDto> Handle(RevokeApiTokenCommand request, CancellationToken cancellationToken)
    {
        var ownerId = await ApiTokenOwner.ModeratorIdAsync(db, user, cancellationToken);
        var token = await db.ApiTokens.SingleOrDefaultAsync(t => t.Id == request.TokenId && t.UserId == ownerId, cancellationToken)
            ?? throw new NotFoundException($"You have no API token with id {request.TokenId}.");
        if (token.RevokedAtUtc is not null)
        {
            throw new EditConflictException("revoked", "This token is already revoked.");
        }

        var now = clock.UtcNow;
        if (!request.Apply)
        {
            return new ApiTokenWriteResultDto("revoked", true, ApiTokenDto.From(token, now), null);
        }

        token.Revoke(now);
        audit.Record("ApiTokenRevoked", nameof(ApiToken), token.Id, token.Name);
        await db.SaveChangesAsync(cancellationToken);
        return new ApiTokenWriteResultDto("revoked", false, ApiTokenDto.From(token, now), null);
    }
}
