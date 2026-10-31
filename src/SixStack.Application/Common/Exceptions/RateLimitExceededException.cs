namespace SixStack.Application.Common.Exceptions;

public sealed class RateLimitExceededException(TimeSpan retryAfter) : Exception("Too many requests")
{
    public TimeSpan RetryAfter { get; } = retryAfter;
}
