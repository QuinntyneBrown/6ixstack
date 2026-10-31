using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

/// <summary>One automated check result on a submission (L2-059). Pending until the outbox runs it.</summary>
public class SubmissionCheck
{
    public const int MaxAttempts = 5;

    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public CheckKind Kind { get; set; }
    public CheckOutcome Outcome { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? RelatedEventId { get; set; }
    public DateTimeOffset? CompletedAtUtc { get; set; }
    public int Attempts { get; set; }

    public void Complete(CheckOutcome outcome, string message, DateTimeOffset now, Guid? relatedEventId = null)
    {
        Outcome = outcome;
        Message = message;
        RelatedEventId = relatedEventId;
        CompletedAtUtc = now;
    }

    /// <summary>Counts a failed run; after the fifth the check gives up as a warning.</summary>
    public void Failed(DateTimeOffset now)
    {
        Attempts++;
        if (Attempts >= MaxAttempts)
        {
            Complete(CheckOutcome.Warning, "Couldn’t run this check", now);
        }
    }
}
