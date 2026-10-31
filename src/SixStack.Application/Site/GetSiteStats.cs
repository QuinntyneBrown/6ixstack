using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Enums;

namespace SixStack.Application.Site;

/// <summary>The About page's live counts (L2-072, static-pages design).</summary>
public sealed record GetSiteStatsQuery : IRequest<SiteStatsDto>;

public sealed record SiteStatsDto(int Year, int Communities, int EventsListedThisYear, int FeedSubscribers, int VolunteerModerators);

public sealed class GetSiteStatsQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetSiteStatsQuery, SiteStatsDto>
{
    public async Task<SiteStatsDto> Handle(GetSiteStatsQuery request, CancellationToken cancellationToken)
    {
        // "Listed this year" counts published events that start in the current Toronto calendar year.
        var year = TorontoTime.Today(clock.UtcNow).Year;
        var from = TorontoTime.StartOf(new DateOnly(year, 1, 1));
        var to = TorontoTime.StartOf(new DateOnly(year + 1, 1, 1));
        var communities = await db.Communities.CountAsync(cancellationToken);
        var events = await db.Events.CountAsync(e => e.Status == EventStatus.Published && e.StartsAtUtc >= from && e.StartsAtUtc < to, cancellationToken);
        var subscribers = await db.Communities.SumAsync(c => c.FeedSubscriberCount, cancellationToken);
        var moderators = await db.Users.CountAsync(u => u.Role == UserRole.Moderator, cancellationToken);
        return new SiteStatsDto(year, communities, events, subscribers, moderators);
    }
}
