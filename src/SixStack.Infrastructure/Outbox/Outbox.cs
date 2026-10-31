using System.Diagnostics;
using System.Text.Json;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Outbox;

public sealed class Outbox(IAppDbContext db, IClock clock) : IOutbox
{
    public void Enqueue<TMessage>(TMessage message) where TMessage : notnull => Enqueue(message, clock.UtcNow);

    public void Enqueue<TMessage>(TMessage message, DateTimeOffset notBeforeUtc) where TMessage : notnull
    {
        db.OutboxMessages.Add(new OutboxMessage
        {
            Type = OutboxTypes.NameOf(typeof(TMessage)),
            Payload = JsonSerializer.Serialize(message),
            NextAttemptAtUtc = notBeforeUtc,
            CorrelationId = Activity.Current?.TraceId.ToString() ?? string.Empty,
        });
    }
}

internal static class OutboxTypes
{
    public static string NameOf(Type type) => $"{type.FullName}, {type.Assembly.GetName().Name}";

    public static Type? Resolve(string name) => Type.GetType(name, throwOnError: false);
}
