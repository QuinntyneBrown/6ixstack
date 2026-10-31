using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

/// <summary>A one-time link token. Only its SHA-256 hash is stored (L2-084).</summary>
public class SecurityToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public SecurityTokenPurpose Purpose { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? UsedAtUtc { get; set; }

    /// <summary>For a sign-in link: the local path to open after signing in.</summary>
    public string? ReturnUrl { get; set; }

    public bool IsUsable(DateTimeOffset now) => UsedAtUtc is null && now < ExpiresAtUtc;
}
