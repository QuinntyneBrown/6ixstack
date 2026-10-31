namespace SixStack.Domain.Entities;

/// <summary>Who did what to which record, and when (L2-086); kept for two years. <c>Sequence</c> keeps their order.</summary>
public class AuditEntry
{
    public long Sequence { get; set; }
    public Guid? ActorId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
}
