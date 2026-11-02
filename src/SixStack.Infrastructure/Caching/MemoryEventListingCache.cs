using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;

namespace SixStack.Infrastructure.Caching;

/// <summary>
/// In-process listing store (ADR 0014): at most <see cref="MaxEntries"/> entries, since search text makes keys
/// unbounded; a new key beyond that is served but not stored. An entry expires after the configured lifetime and
/// at the next Toronto midnight, whichever comes first, both measured with <see cref="IClock"/> (L2-129).
/// </summary>
public sealed class MemoryEventListingCache(IClock clock, IOptions<EventListingCacheOptions> options) : IEventListingCache
{
    public const int MaxEntries = 1000;

    private readonly ConcurrentDictionary<string, Entry> entries = new(StringComparer.Ordinal);
    private readonly Lock gate = new();
    private long generation;

    public long Generation => Interlocked.Read(ref generation);

    public CachedListing? TryGet(string key)
    {
        if (!entries.TryGetValue(key, out var entry))
        {
            return null;
        }

        if (clock.UtcNow < entry.ExpiresAtUtc)
        {
            return entry.Listing;
        }

        entries.TryRemove(new KeyValuePair<string, Entry>(key, entry));
        return null;
    }

    public void Set(string key, CachedListing listing, long generationAtStart)
    {
        var now = clock.UtcNow;
        var midnight = TorontoTime.StartOf(TorontoTime.Today(now).AddDays(1));
        var expires = now + options.Value.Lifetime;
        var entry = new Entry(listing, expires < midnight ? expires : midnight);
        lock (gate)
        {
            if (generationAtStart != generation || (entries.Count >= MaxEntries && !entries.ContainsKey(key)))
            {
                return;
            }

            entries[key] = entry;
        }
    }

    public void EvictAll()
    {
        lock (gate)
        {
            Interlocked.Increment(ref generation);
            entries.Clear();
        }
    }

    private sealed record Entry(CachedListing Listing, DateTimeOffset ExpiresAtUtc);
}
