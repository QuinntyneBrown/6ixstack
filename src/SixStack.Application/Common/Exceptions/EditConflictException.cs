namespace SixStack.Application.Common.Exceptions;

/// <summary>A save that cannot apply: the event is read-only, or another save or decision got there first. Maps to 409.</summary>
public sealed class EditConflictException(string reason, string title) : Exception(title)
{
    /// <summary><c>read-only</c> or <c>changed</c>.</summary>
    public string Reason { get; } = reason;
}
