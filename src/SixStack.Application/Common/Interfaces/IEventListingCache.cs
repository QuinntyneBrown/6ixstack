namespace SixStack.Application.Common.Interfaces;

/// <summary>
/// The public event listings kept in memory (platform/event-listing-cache, L2-125): one entry per normalised
/// request, dropped all at once when a change that can alter a listing is saved (L2-128).
/// </summary>
public interface IEventListingCache
{
    /// <summary>Rises on every eviction; a result computed under an older generation is not stored.</summary>
    long Generation { get; }

    CachedListing? TryGet(string key);

    /// <summary>Stores <paramref name="listing"/> unless an eviction happened since <paramref name="generation"/> was read.</summary>
    void Set(string key, CachedListing listing, long generation);

    void EvictAll();
}

/// <summary>A stored listing response: its status (200 or 204), content type, body and quoted entity tag.</summary>
public sealed record CachedListing(int StatusCode, string? ContentType, byte[] Body, string ETag);
