namespace SixStack.Application.Events;

/// <summary>How venue coordinates are found (ADR 0013).</summary>
public sealed class GeocodingOptions
{
    public const string Section = "Geocoding";

    /// <summary><c>false</c> turns the background job off; API tests and Playwright keep their seeded maps that way.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary><c>Local</c> uses each city's reference point without the network; <c>Nominatim</c> asks OpenStreetMap.</summary>
    public string Provider { get; set; } = "Local";

    /// <summary>Time between runs; the first run waits at most 30 seconds after start-up.</summary>
    public TimeSpan Interval { get; set; } = TimeSpan.FromMinutes(5);
}
