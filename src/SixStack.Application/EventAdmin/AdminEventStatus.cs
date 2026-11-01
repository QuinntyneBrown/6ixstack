using SixStack.Domain.Enums;

namespace SixStack.Application.EventAdmin;

/// <summary>The CLI's status names: the camelCase names of <see cref="EventStatus"/> (event-admin-cli design).</summary>
public static class AdminEventStatus
{
    public static readonly IReadOnlyDictionary<string, EventStatus> ByName = new Dictionary<string, EventStatus>(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = EventStatus.Draft,
        ["inReview"] = EventStatus.InReview,
        ["published"] = EventStatus.Published,
        ["rejected"] = EventStatus.Rejected,
        ["deleted"] = EventStatus.Deleted,
        ["needsChanges"] = EventStatus.NeedsChanges,
    };

    public static string Name(EventStatus status) => ByName.First(kv => kv.Value == status).Key;
}
