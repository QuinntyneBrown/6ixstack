namespace SixStack.Application.Common.Exceptions;

/// <summary>
/// A moderation decision that lost to an earlier one (L2-063), or an undo after its window. Maps to 409 with the
/// earlier <c>decision</c> and the first name of the moderator who made it.
/// </summary>
public sealed class DecisionConflictException(string decision, string? decidedBy, string reason = "decided")
    : Exception($"Already {decision}.")
{
    public string Decision { get; } = decision;
    public string? DecidedBy { get; } = decidedBy;
    public string Reason { get; } = reason;
}
