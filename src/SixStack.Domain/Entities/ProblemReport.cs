namespace SixStack.Domain.Entities;

/// <summary>What is wrong with a listing, as a visitor reported it (L2-039, L2-040). The reporter stays anonymous to organizers.</summary>
public class ProblemReport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Event? Event { get; set; }
    public ReportReason Reason { get; set; }
    public string? Details { get; set; }

    /// <summary>Only for a moderator's reply; never shown to organizers (L2-099).</summary>
    public string? ReplyEmail { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }
}

public enum ReportReason
{
    WrongDetails = 0,
    Cancelled = 1,
    BrokenLink = 2,
    Spam = 3,
    CodeOfConduct = 4,
}
