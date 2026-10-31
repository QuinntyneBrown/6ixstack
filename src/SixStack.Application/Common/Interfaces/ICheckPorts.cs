namespace SixStack.Application.Common.Interfaces;

public enum LinkCheckResult
{
    Reachable = 0,
    Unreachable = 1,
}

/// <summary>Requests a submitted link with a 5 s timeout; 2xx and 3xx are reachable (L2-059).</summary>
public interface ILinkChecker
{
    Task<LinkCheckResult> CheckAsync(string url, CancellationToken cancellationToken);
}

/// <summary>Finds a venue address on the map.</summary>
public interface IGeocoder
{
    Task<bool> ResolvesAsync(string address, string city, CancellationToken cancellationToken);
}
