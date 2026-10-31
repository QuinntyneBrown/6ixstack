using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Application.Common.Time;
using SixStack.Domain.Enums;

namespace SixStack.Application.Notifications;

/// <summary>Queues the weekly summary for every organizer who turned it on (L2-067); returns how many were queued.</summary>
public sealed record SendWeeklySummariesCommand : IRequest<int>;

/// <summary>
/// "Your week on 6ixstack": going counts for the community's published events in the next two weeks and its feed
/// followers, one email per organizer with `WeeklySummary` on. Organizers with it off get nothing.
/// </summary>
public sealed class SendWeeklySummariesCommandHandler(IAppDbContext db, IClock clock, IOutbox outbox, IOptions<SiteOptions> site)
    : IRequestHandler<SendWeeklySummariesCommand, int>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<int> Handle(SendWeeklySummariesCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var until = now.AddDays(14);
        var organizers = await db.Users.AsNoTracking()
            .Include(u => u.Communities).ThenInclude(c => c.Community)
            .Where(u => u.Role == UserRole.Organizer && u.EmailPreferences.WeeklySummary)
            .ToListAsync(cancellationToken);
        var queued = 0;
        foreach (var user in organizers)
        {
            var community = user.Communities.Select(c => c.Community).FirstOrDefault();
            if (community is null)
            {
                continue;
            }

            var events = await db.Events.AsNoTracking()
                .Where(e => e.CommunityId == community.Id && e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.StartsAtUtc >= now && e.StartsAtUtc < until)
                .ToListAsync(cancellationToken);
            var lines = events.OrderBy(e => e.StartsAtUtc)
                .Select(e => $"• {e.Title} · {TorontoTime.ToLocal(e.StartsAtUtc).ToString("ddd, MMM d", En)} · {e.GoingCount.ToString("N0", En)} going")
                .ToList();
            var body = string.Join("\n\n", new[]
            {
                $"Here’s how {community.Name}’s events are doing.",
                lines.Count > 0 ? string.Join("\n", lines) : "Nothing is scheduled in the next two weeks.",
                community.FeedSubscriberCount > 0 ? $"{community.FeedSubscriberCount.ToString("N0", En)} people follow {community.Name} in a calendar feed." : null,
                $"Your events: {site.Value.PublicBaseUrl.TrimEnd('/')}/organize",
            }.Where(p => p is not null));
            outbox.Enqueue(new SendEmail(new EmailMessage(user.Email, "Your week on 6ixstack", body)));
            queued++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return queued;
    }
}
