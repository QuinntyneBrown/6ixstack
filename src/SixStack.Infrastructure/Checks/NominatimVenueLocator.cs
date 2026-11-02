using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Infrastructure.Checks;

/// <summary>
/// Looks venue addresses up on OpenStreetMap Nominatim, within Canada, at most one request a second and with an
/// identifying User-Agent, as its usage policy asks. An address it does not find sits at its city's reference point;
/// a network error or non-success status gives <c>null</c>, so the next run tries again (ADR 0013).
/// </summary>
public sealed class NominatimVenueLocator(HttpClient http) : IVenueLocator
{
    public static readonly Uri BaseAddress = new("https://nominatim.openstreetmap.org/");
    public const string UserAgent = "6ixstack/1.0 (+https://6ixstack.net)";
    public static readonly TimeSpan Timeout = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan MinimumGap = TimeSpan.FromSeconds(1.1);

    private DateTimeOffset? lastRequest;

    public async Task<GeoPoint?> LocateAsync(string address, string city, CancellationToken cancellationToken)
    {
        if (lastRequest is { } last && DateTimeOffset.UtcNow - last < MinimumGap)
        {
            await Task.Delay(MinimumGap - (DateTimeOffset.UtcNow - last), cancellationToken);
        }

        lastRequest = DateTimeOffset.UtcNow;
        var query = string.Join(", ", new[] { address, city, "Ontario", "Canada" }.Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => p.Trim()));
        var uri = new Uri(BaseAddress, $"search?format=jsonv2&limit=1&countrycodes=ca&q={Uri.EscapeDataString(query)}");
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.UserAgent.ParseAdd(UserAgent);
        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var results = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            if (results.ValueKind == JsonValueKind.Array && results.GetArrayLength() > 0
                && TryDegrees(results[0], "lat", out var lat) && TryDegrees(results[0], "lon", out var lon))
            {
                return new GeoPoint(lat, lon);
            }

            return LocalVenueLocator.CityPoint(city);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or OperationCanceledException && !cancellationToken.IsCancellationRequested)
        {
            return null;
        }
    }

    private static bool TryDegrees(JsonElement result, string name, out double value)
    {
        value = 0;
        return result.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String
            && double.TryParse(v.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out value);
    }
}
