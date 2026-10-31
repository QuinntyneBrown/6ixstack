using System.Text.RegularExpressions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.ReferenceData;

namespace SixStack.Infrastructure.Checks;

/// <summary>
/// Stand-in until a hosted geocoding provider is chosen: an address with a street number and street name in one of
/// the GTA cities from the reference list counts as found (automated-checks design).
/// </summary>
public sealed partial class LocalGeocoder : IGeocoder
{
    public Task<bool> ResolvesAsync(string address, string city, CancellationToken cancellationToken) =>
        Task.FromResult(
            GetReferenceDataQuery.Cities.Contains(city) && city != "Online only" && StreetAddress().IsMatch(address));

    [GeneratedRegex(@"^\s*\d+[A-Za-z]?\s+\p{L}{2,}")]
    private static partial Regex StreetAddress();
}
