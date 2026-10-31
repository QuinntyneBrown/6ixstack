namespace SixStack.Domain.Entities;

/// <summary>Background work committed with the user's change and processed with retries (L2-103).</summary>
public class OutboxMessage
{
    public const int MaxAttempts = 5;

    public Guid Id { get; set; } = Guid.NewGuid();
    public string Type { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public int AttemptCount { get; set; }
    public DateTimeOffset NextAttemptAtUtc { get; set; }
    public DateTimeOffset? ProcessedAtUtc { get; set; }
    public DateTimeOffset? LockedUntilUtc { get; set; }
    public DateTimeOffset? FailedAtUtc { get; set; }
    public string? LastError { get; set; }
    public string CorrelationId { get; set; } = string.Empty;

    public void MarkProcessed(DateTimeOffset now)
    {
        ProcessedAtUtc = now;
        LockedUntilUtc = null;
    }

    /// <summary>Records a failed attempt and schedules the next one as base × 2^(n-1), giving up after <see cref="MaxAttempts"/>.</summary>
    public void MarkFailed(string error, DateTimeOffset now, TimeSpan baseDelay)
    {
        AttemptCount++;
        LastError = error;
        LockedUntilUtc = null;
        if (AttemptCount >= MaxAttempts)
        {
            FailedAtUtc = now;
            return;
        }

        NextAttemptAtUtc = now + TimeSpan.FromTicks(baseDelay.Ticks * (1L << (AttemptCount - 1)));
    }
}
