using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

/// <summary>A moderator's approval or rejection of a submission; undone decisions keep their row.</summary>
public class ModerationDecision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Event? Event { get; set; }
    public Guid? ModeratorId { get; set; }
    public DecisionKind Kind { get; set; }
    public DateTimeOffset DecidedAtUtc { get; set; }
    public DateTimeOffset? UndoneAtUtc { get; set; }
    public RejectionReason? Reason { get; set; }
    public string? Message { get; set; }
}
