namespace SixStack.Infrastructure.Outbox;

public sealed class OutboxOptions
{
    public const string Section = "Outbox";

    /// <summary>How often the processor looks for due messages.</summary>
    public TimeSpan PollInterval { get; set; } = TimeSpan.FromSeconds(5);

    /// <summary>Delay before the second attempt; later attempts double it (L2-103).</summary>
    public TimeSpan RetryBaseDelay { get; set; } = TimeSpan.FromSeconds(30);

    public TimeSpan LockDuration { get; set; } = TimeSpan.FromMinutes(2);

    public int BatchSize { get; set; } = 20;
}
