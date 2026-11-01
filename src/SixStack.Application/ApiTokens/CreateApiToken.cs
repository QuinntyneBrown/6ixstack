using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.ApiTokens;

/// <summary>
/// Issues an API token for the current user, who must be a moderator (L2-120, L2-124). With <c>Apply</c> false it
/// validates and previews without storing anything.
/// </summary>
public sealed record CreateApiTokenCommand(string? Name, int Days, bool Apply) : IRequest<ApiTokenWriteResultDto>;

public sealed class CreateApiTokenCommandValidator : AbstractValidator<CreateApiTokenCommand>
{
    public CreateApiTokenCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().WithMessage("Name the token, such as laptop-agent.")
            .MaximumLength(ApiToken.NameMaxLength).WithMessage($"Use {ApiToken.NameMaxLength} characters or fewer.");
        RuleFor(c => c.Days).InclusiveBetween(1, ApiToken.MaxDays).WithMessage($"Choose a lifetime from 1 to {ApiToken.MaxDays} days.");
    }
}

/// <summary>Stores only the salt and hash, records <c>ApiTokenCreated</c> with the name, and returns the plaintext once.</summary>
public sealed class CreateApiTokenCommandHandler(IAppDbContext db, IClock clock, ICurrentUser user, IApiTokenHasher hasher, IAuditLog audit)
    : IRequestHandler<CreateApiTokenCommand, ApiTokenWriteResultDto>
{
    public async Task<ApiTokenWriteResultDto> Handle(CreateApiTokenCommand request, CancellationToken cancellationToken)
    {
        var ownerId = await ApiTokenOwner.ModeratorIdAsync(db, user, cancellationToken);
        var now = clock.UtcNow;
        var token = new ApiToken
        {
            UserId = ownerId,
            Name = request.Name!.Trim(),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddDays(request.Days),
        };
        if (!request.Apply)
        {
            return new ApiTokenWriteResultDto("created", true, ApiTokenDto.From(token, now), null);
        }

        var secret = hasher.Create(token.Id);
        token.Salt = secret.Salt;
        token.TokenHash = secret.Hash;
        db.ApiTokens.Add(token);
        audit.Record("ApiTokenCreated", nameof(ApiToken), token.Id, token.Name);
        await db.SaveChangesAsync(cancellationToken);
        return new ApiTokenWriteResultDto("created", false, ApiTokenDto.From(token, now), secret.Token);
    }
}

/// <summary>Only a moderator holds API tokens; the role is read from the database, not trusted from the caller.</summary>
internal static class ApiTokenOwner
{
    public static async Task<Guid> ModeratorIdAsync(IAppDbContext db, ICurrentUser user, CancellationToken cancellationToken)
    {
        var id = user.UserId ?? throw new ForbiddenAccessException("Only a moderator can hold API tokens.");
        var role = await db.Users.AsNoTracking().Where(u => u.Id == id).Select(u => (UserRole?)u.Role).SingleOrDefaultAsync(cancellationToken);
        return role == UserRole.Moderator ? id : throw new ForbiddenAccessException("Only a moderator can hold API tokens.");
    }
}
