using System.Collections.Concurrent;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Infrastructure.Caching;

/// <summary>
/// In-process listing store (ADR 0014): at most <see cref="MaxEntries"/> entries, since search text makes keys
/// unbounded; a new key beyond that is served but not stored.
/// </summary>
public sealed class MemoryEventListingCache : IEventListingCache
{
    public const int MaxEntries = 1000;

    private readonly ConcurrentDictionary<string, CachedListing> entries = new(StringComparer.Ordinal);
    private readonly Lock gate = new();
    private long generation;

    public long Generation => Interlocked.Read(ref generation);

    public CachedListing? TryGet(string key) => entries.TryGetValue(key, out var listing) ? listing : null;

    public void Set(string key, CachedListing listing, long generationAtStart)
    {
        lock (gate)
        {
            if (generationAtStart != generation || (entries.Count >= MaxEntries && !entries.ContainsKey(key)))
            {
                return;
            }

            entries[key] = listing;
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
}
