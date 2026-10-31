using SixStack.Domain.Entities;
using SixStack.Domain.Enums;
using SixStack.Domain.ValueObjects;

namespace SixStack.Application.Feeds;

/// <summary>Narrows events to a feed: any chosen topic, the scope (hybrid counts for both), and the community.</summary>
public static class FeedEventFilter
{
    public static IQueryable<Event> Apply(IQueryable<Event> events, FeedSlug slug, Guid? communityId)
    {
        if (slug.Topics != Topics.None)
        {
            events = events.Where(e => (e.Topics & slug.Topics) != Topics.None);
        }

        events = slug.Scope switch
        {
            FeedScope.GtaOnly => events.Where(e => e.Format == EventFormat.InPerson || e.Format == EventFormat.Hybrid),
            FeedScope.StreamingOnly => events.Where(e => e.Format == EventFormat.Streaming || e.Format == EventFormat.Hybrid),
            _ => events,
        };
        return communityId is { } id ? events.Where(e => e.CommunityId == id) : events;
    }
}
