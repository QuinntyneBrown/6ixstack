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

/// <summary>A place on the map, in degrees.</summary>
public sealed record GeoPoint(double Latitude, double Longitude);

/// <summary>Turns a venue address into map coordinates; <c>null</c> when it cannot answer now (ADR 0013).</summary>
public interface IVenueLocator
{
    Task<GeoPoint?> LocateAsync(string address, string city, CancellationToken cancellationToken);
}
