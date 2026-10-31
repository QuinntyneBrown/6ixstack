using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Application.Events;
using SixStack.Domain.Enums;
using SixStack.Domain.ValueObjects;

namespace SixStack.Application.Feeds;

public sealed record ReadyMadeFeed(string Key, string Name, FeedSlug Slug);

/// <summary>The six ready-made feeds in display order (L2-034); keys match the web app's list.</summary>
public static class ReadyMadeFeedCatalogue
{
    public static readonly ReadyMadeFeed[] Feeds =
    [
        new("everything", "Everything", new FeedSlug(Topics.None, FeedScope.All, null)),
        new("gta", "In the GTA", new FeedSlug(Topics.None, FeedScope.GtaOnly, null)),
        new("streaming", "Streaming", new FeedSlug(Topics.None, FeedScope.StreamingOnly, null)),
        new("ai", "AI", new FeedSlug(Topics.AI, FeedScope.All, null)),
        new("dotnet", ".NET", new FeedSlug(Topics.DotNet, FeedScope.All, null)),
        new("azure", "Azure", new FeedSlug(Topics.Azure, FeedScope.All, null)),
    ];
}

public sealed record ReadyMadeFeedCountDto(string Key, string FeedSlug, int UpcomingCount);

public sealed record ReadyMadeFeedsDto(IReadOnlyList<ReadyMadeFeedCountDto> Feeds);

/// <summary>How many events each ready-made feed holds in the events page's two-week window (L2-034).</summary>
public sealed record GetReadyMadeFeedsQuery : IRequest<ReadyMadeFeedsDto>;

public sealed class GetReadyMadeFeedsQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetReadyMadeFeedsQuery, ReadyMadeFeedsDto>
{
    public async Task<ReadyMadeFeedsDto> Handle(GetReadyMadeFeedsQuery request, CancellationToken cancellationToken)
    {
        var today = TorontoTime.Today(clock.UtcNow);
        var from = TorontoTime.StartOf(today);
        var to = TorontoTime.StartOf(today.AddDays(GetUpcomingEventsQuery.UpcomingWindowDays));
        var window = db.Events.AsNoTracking()
            .Where(e => e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.StartsAtUtc >= from && e.StartsAtUtc < to);
        var feeds = new List<ReadyMadeFeedCountDto>();
        foreach (var feed in ReadyMadeFeedCatalogue.Feeds)
        {
            feeds.Add(new ReadyMadeFeedCountDto(feed.Key, feed.Slug.ToString(), await FeedEventFilter.Apply(window, feed.Slug, null).CountAsync(cancellationToken)));
        }

        return new ReadyMadeFeedsDto(feeds);
    }
}
