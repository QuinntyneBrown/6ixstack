namespace SixStack.Application.Common.Interfaces;

/// <summary>Adds background work to the current unit of work, so it commits with the user's change (L2-103).</summary>
public interface IOutbox
{
    void Enqueue<TMessage>(TMessage message) where TMessage : notnull;

    /// <summary>Holds the message until <paramref name="notBeforeUtc"/>, e.g. until an undo window closes.</summary>
    void Enqueue<TMessage>(TMessage message, DateTimeOffset notBeforeUtc) where TMessage : notnull;
}

/// <summary>Processes one outbox message type.</summary>
public interface IOutboxMessageHandler<in TMessage>
{
    Task HandleAsync(TMessage message, CancellationToken cancellationToken);
}
