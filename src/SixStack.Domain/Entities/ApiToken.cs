namespace SixStack.Domain.Entities;

/// <summary>
/// A moderator's personal bearer token for the admin API (L2-120, ADR 0012). Only a salt and the salted hash of its
/// secret are stored; the plaintext is shown once when it is issued.
/// </summary>
public class ApiToken
{
    public const int NameMaxLength = 80;
    public const int DefaultDays = 90;
    public const int MaxDays = 365;

    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Salt { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? LastUsedAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }

    /// <summary>Usable until revoked or expired.</summary>
    public bool IsActive(DateTimeOffset now) => RevokedAtUtc is null && now < ExpiresAtUtc;

    /// <summary><c>active</c>, <c>revoked</c> or <c>expired</c>.</summary>
    public string StatusAt(DateTimeOffset now) => RevokedAtUtc is not null ? "revoked" : now < ExpiresAtUtc ? "active" : "expired";

    public void Revoke(DateTimeOffset now) => RevokedAtUtc ??= now;
}
