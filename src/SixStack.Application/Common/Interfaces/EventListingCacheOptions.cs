namespace SixStack.Application.Common.Interfaces;

/// <summary><c>EventListingCache</c> settings (L2-129).</summary>
public sealed class EventListingCacheOptions
{
    public const string Section = "EventListingCache";

    /// <summary>How long an entry lives at most; it also ends at the next Toronto midnight.</summary>
    public TimeSpan Lifetime { get; set; } = TimeSpan.FromMinutes(5);
}
