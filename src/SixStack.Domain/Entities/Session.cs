namespace SixStack.Domain.Entities;

/// <summary>One signed-in device. The cookie carries only its id (ADR 0009); revoking the row signs the device out.</summary>
public class Session
{
    public static readonly TimeSpan IdleLimit = TimeSpan.FromDays(14);

    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset LastSeenAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }

    /// <summary>Active until revoked or unused for 14 days (L2-048).</summary>
    public bool IsActive(DateTimeOffset now) => RevokedAtUtc is null && now - LastSeenAtUtc <= IdleLimit;

    public static Session Start(Guid userId, DateTimeOffset now) => new() { UserId = userId, CreatedAtUtc = now, LastSeenAtUtc = now };
}
