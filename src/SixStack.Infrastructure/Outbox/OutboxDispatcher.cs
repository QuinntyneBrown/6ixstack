using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Infrastructure.Outbox;

/// <summary>Claims due outbox messages and runs their handlers, retrying with exponential backoff.</summary>
public sealed class OutboxDispatcher(
    AppDbContext db,
    IServiceProvider services,
    IClock clock,
    IOptions<OutboxOptions> options,
    ILogger<OutboxDispatcher> logger)
{
    public async Task<int> ProcessDueAsync(CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var settings = options.Value;
        var due = await db.OutboxMessages
            .Where(m => m.ProcessedAtUtc == null && m.FailedAtUtc == null)
            .Where(m => m.NextAttemptAtUtc <= now && (m.LockedUntilUtc == null || m.LockedUntilUtc < now))
            .OrderBy(m => m.NextAttemptAtUtc)
            .Take(settings.BatchSize)
            .ToListAsync(cancellationToken);

        foreach (var message in due)
        {
            message.LockedUntilUtc = now + settings.LockDuration;
        }

        await db.SaveChangesAsync(cancellationToken);

        foreach (var message in due)
        {
            using var scope = logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = message.CorrelationId });
            try
            {
                await DispatchAsync(message, cancellationToken);
                message.MarkProcessed(clock.UtcNow);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                message.MarkFailed(ex.Message, clock.UtcNow, settings.RetryBaseDelay);
                if (message.FailedAtUtc is not null)
                {
                    logger.LogError(ex, "Outbox message {MessageId} of type {Type} failed after {Attempts} attempts", message.Id, message.Type, message.AttemptCount);
                }
                else
                {
                    logger.LogWarning(ex, "Outbox message {MessageId} of type {Type} failed; attempt {Attempts}", message.Id, message.Type, message.AttemptCount);
                }
            }

            await db.SaveChangesAsync(cancellationToken);
        }

        return due.Count;
    }

    private async Task DispatchAsync(OutboxMessage message, CancellationToken cancellationToken)
    {
        var type = OutboxTypes.Resolve(message.Type) ?? throw new InvalidOperationException($"Unknown outbox message type {message.Type}");
        var payload = JsonSerializer.Deserialize(message.Payload, type) ?? throw new InvalidOperationException("Empty outbox payload");
        var handlerType = typeof(IOutboxMessageHandler<>).MakeGenericType(type);
        var handler = services.GetRequiredService(handlerType);
        var method = handlerType.GetMethod(nameof(IOutboxMessageHandler<object>.HandleAsync))!;
        await (Task)method.Invoke(handler, [payload, cancellationToken])!;
    }
}
