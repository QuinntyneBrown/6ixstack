using Microsoft.Extensions.Primitives;

namespace SixStack.Api.Platform;

/// <summary>
/// The listing cache key (L2-125): the path, then the parameters the listing actions bind, normalised so that
/// requests answered identically share an entry. Normalising never makes an invalid request valid: formats and
/// topic keys are case-insensitive, and the search text is trimmed and cut as the handlers do.
/// </summary>
public static class EventListingCacheKey
{
    public const int MaxSearchLength = 100;

    public static string For(PathString path, IQueryCollection query)
    {
        var format = Single(query["format"]).ToLowerInvariant();
        var topics = string.Join(',', query["topics"]
            .Select(t => (t ?? string.Empty).ToLowerInvariant())
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal));
        var q = Single(query["q"]).Trim();
        if (q.Length > MaxSearchLength)
        {
            q = q[..MaxSearchLength];
        }

        var page = Single(query["page"]);
        if (int.TryParse(page, out var number))
        {
            page = number.ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        return string.Join('\u001f', path.Value?.ToLowerInvariant(), format, topics, q, page, Single(query["month"]));
    }

    // Model binding takes the first value of a repeated scalar parameter.
    private static string Single(StringValues values) => values.Count > 0 ? values[0] ?? string.Empty : string.Empty;
}
