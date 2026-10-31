namespace SixStack.Domain.Entities;

/// <summary>A moderator looking at a submission right now (L2-063); refreshed while the card holds focus.</summary>
public class ReviewPresence
{
    public static readonly TimeSpan Timeout = TimeSpan.FromSeconds(45);

    public Guid EventId { get; set; }
    public Guid ModeratorId { get; set; }
    public DateTimeOffset LastSeenAtUtc { get; set; }
}
