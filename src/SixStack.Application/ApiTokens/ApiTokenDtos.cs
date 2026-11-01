using System.Text.Json.Serialization;
using SixStack.Domain.Entities;

namespace SixStack.Application.ApiTokens;

/// <summary>One API token as <c>tokens list</c> shows it: never the token, its salt or its hash (L2-120).</summary>
public sealed record ApiTokenDto(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset ExpiresAtUtc,
    DateTimeOffset? LastUsedAtUtc,
    DateTimeOffset? RevokedAtUtc,
    string Status)
{
    public static ApiTokenDto From(ApiToken t, DateTimeOffset now) =>
        new(t.Id, t.Name, t.CreatedAtUtc, t.ExpiresAtUtc, t.LastUsedAtUtc, t.RevokedAtUtc, t.StatusAt(now));
}

public sealed record ApiTokenListDto(int Count, IReadOnlyList<ApiTokenDto> Tokens);

/// <summary>
/// The result of a <c>tokens</c> write, or its preview when <c>DryRun</c> is true. <c>Token</c> is the plaintext,
/// set only by an applied create, once (L2-124).
/// </summary>
public sealed record ApiTokenWriteResultDto(
    string Action,
    bool DryRun,
    ApiTokenDto ApiToken,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Token);
