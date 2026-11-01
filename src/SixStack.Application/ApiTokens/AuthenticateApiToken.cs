using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Application.ApiTokens;

/// <summary>Who an API token acts as: the token and its owner, with the owner's current role (L2-121).</summary>
public sealed record ApiTokenPrincipalDto(Guid TokenId, Guid UserId, string Email, UserRole Role);

/// <summary>
/// Checks a bearer token (L2-120, L2-121): well formed, known, not revoked, not expired, and its secret matches the
/// stored salted hash. Records the time of use. Returns null for any token that fails, without saying why.
/// </summary>
public sealed record AuthenticateApiTokenCommand(string Token) : IRequest<ApiTokenPrincipalDto?>;

public sealed class AuthenticateApiTokenCommandHandler(IAppDbContext db, IClock clock, IApiTokenHasher hasher)
    : IRequestHandler<AuthenticateApiTokenCommand, ApiTokenPrincipalDto?>
{
    public async Task<ApiTokenPrincipalDto?> Handle(AuthenticateApiTokenCommand request, CancellationToken cancellationToken)
    {
        if (hasher.ReadId(request.Token) is not { } id)
        {
            return null;
        }

        var token = await db.ApiTokens.Include(t => t.User).SingleOrDefaultAsync(t => t.Id == id, cancellationToken);
        var now = clock.UtcNow;
        if (token?.User is null || !token.IsActive(now) || !hasher.Verify(request.Token, token.Salt, token.TokenHash))
        {
            return null;
        }

        token.LastUsedAtUtc = now;
        await db.SaveChangesAsync(cancellationToken);
        return new ApiTokenPrincipalDto(token.Id, token.UserId, token.User.Email, token.User.Role);
    }
}
