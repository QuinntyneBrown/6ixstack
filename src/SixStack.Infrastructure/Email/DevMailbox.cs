using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Infrastructure.Email;

public sealed record DevMailboxEntry(DateTimeOffset ReceivedAtUtc, EmailMessage Message);

/// <summary>Local sink for outgoing email in development and tests. Nothing leaves the machine.</summary>
public sealed class DevMailbox
{
    private readonly ConcurrentQueue<DevMailboxEntry> entries = new();

    public void Add(DevMailboxEntry entry) => entries.Enqueue(entry);

    public IReadOnlyList<DevMailboxEntry> All() => [.. entries];

    public IReadOnlyList<DevMailboxEntry> For(string to) =>
        [.. entries.Where(e => string.Equals(e.Message.To, to, StringComparison.OrdinalIgnoreCase))];
}

public sealed class DevMailboxEmailSender(DevMailbox mailbox, IClock clock, ILogger<DevMailboxEmailSender> logger) : IEmailSender
{
    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        mailbox.Add(new DevMailboxEntry(clock.UtcNow, message));
        logger.LogInformation("Dev mailbox received an email with subject {Subject}", message.Subject);
        return Task.CompletedTask;
    }
}
