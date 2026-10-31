namespace SixStack.Application.Common.Interfaces;

/// <summary>Supplies the current instant, so tests and demos can fix "today".</summary>
public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
