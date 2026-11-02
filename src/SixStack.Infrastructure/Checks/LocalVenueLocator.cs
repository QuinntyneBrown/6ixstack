using SixStack.Application.Common.Interfaces;

namespace SixStack.Infrastructure.Checks;

/// <summary>
/// Places a venue at its city's reference point without the network; tests, Playwright, demos and development use
/// it, and the Nominatim locator falls back to it (ADR 0013).
/// </summary>
public sealed class LocalVenueLocator : IVenueLocator
{
    private static readonly Dictionary<string, GeoPoint> Cities = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Toronto"] = new(43.6532, -79.3832),
        ["Mississauga"] = new(43.589, -79.644),
        ["Brampton"] = new(43.7315, -79.7624),
        ["Markham"] = new(43.8561, -79.337),
        ["Vaughan"] = new(43.8372, -79.5083),
        ["Oakville"] = new(43.4675, -79.6877),
        ["Richmond Hill"] = new(43.8828, -79.4403),
    };

    public static GeoPoint? CityPoint(string city) => Cities.GetValueOrDefault(city.Trim());

    public Task<GeoPoint?> LocateAsync(string address, string city, CancellationToken cancellationToken) =>
        Task.FromResult(CityPoint(city));
}
