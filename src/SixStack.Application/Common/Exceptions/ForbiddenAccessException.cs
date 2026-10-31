namespace SixStack.Application.Common.Exceptions;

public sealed class ForbiddenAccessException(string message = "Forbidden") : Exception(message)
{
    /// <summary>Problem-details extension members, such as ownerName and resourceTitle.</summary>
    public IDictionary<string, object?> Extensions { get; } = new Dictionary<string, object?>();
}
