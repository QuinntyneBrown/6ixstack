using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;
using SixStack.Domain.ValueObjects;

namespace SixStack.Application.Feeds;

/// <summary>A feed document, or why there is none.</summary>
public sealed record CalendarFeedResult(bool Found, bool NotModified, string? Content, string? ETag);

/// <summary>The iCalendar document behind a feed link (L2-036).</summary>
public sealed record GetCalendarFeedQuery(string Slug, string? IfNoneMatch) : IRequest<CalendarFeedResult>;

/// <summary>
/// Published events (cancelled ones included, marked cancelled) that end no earlier than 30 days ago and match the
/// feed. Unknown slugs and communities are not found; a matching ETag is not modified.
/// </summary>
public sealed class GetCalendarFeedQueryHandler(IAppDbContext db, IClock clock, IIcsWriter ics) : IRequestHandler<GetCalendarFeedQuery, CalendarFeedResult>
{
    public static readonly TimeSpan Lookback = TimeSpan.FromDays(30);

    public async Task<CalendarFeedResult> Handle(GetCalendarFeedQuery request, CancellationToken cancellationToken)
    {
        if (!FeedSlug.TryParse(request.Slug, out var slug))
        {
            return new CalendarFeedResult(false, false, null, null);
        }

        Guid? communityId = null;
        var name = ReadyMadeFeedCatalogue.Feeds.FirstOrDefault(f => f.Slug == slug)?.Name ?? FeedName(slug);
        if (slug.CommunitySlug is not null)
        {
            var community = await db.Communities.AsNoTracking().Where(c => c.Slug == slug.CommunitySlug).Select(c => new { c.Id, c.Name }).SingleOrDefaultAsync(cancellationToken);
            if (community is null)
            {
                return new CalendarFeedResult(false, false, null, null);
            }

            communityId = community.Id;
            name = community.Name;
        }

        var since = clock.UtcNow - Lookback;
        var events = await FeedEventFilter.Apply(
                db.Events.AsNoTracking().Include(e => e.Community).Where(e => e.Status == EventStatus.Published && e.EndsAtUtc >= since),
                slug,
                communityId)
            .ToListAsync(cancellationToken);
        var content = ics.WriteCalendar($"6ixstack: {name}", events.OrderBy(e => e.StartsAtUtc).ThenBy(e => e.Title, StringComparer.Ordinal));
        var etag = $"\"{Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(StripStamps(content))))[..32]}\"";
        return request.IfNoneMatch == etag
            ? new CalendarFeedResult(true, true, null, etag)
            : new CalendarFeedResult(true, false, content, etag);
    }

    /// <summary>DTSTAMP is the request time, so the ETag hashes everything else.</summary>
    private static string StripStamps(string content) =>
        string.Join("\r\n", content.Split("\r\n").Where(l => !l.StartsWith("DTSTAMP:", StringComparison.Ordinal)));

    private static string FeedName(FeedSlug slug) => slug.ToString();
}
