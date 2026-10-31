using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CommunityId { get; set; }
    public Community? Community { get; set; }
    public EventStatus Status { get; set; } = EventStatus.Draft;
    public EventFormat Format { get; set; }
    public Topics Topics { get; set; }
    public DateTimeOffset StartsAtUtc { get; set; }
    public DateTimeOffset EndsAtUtc { get; set; }

    /// <summary>IANA time zone the organizer entered the times in.</summary>
    public string TimeZoneId { get; set; } = "America/Toronto";

    /// <summary>IANA time zone of a stream's origin, shown as the source time ("9:00 AM PT").</summary>
    public string? SourceTimeZoneId { get; set; }

    public Venue? Venue { get; set; }

    /// <summary>Price in whole cents; 0 means free.</summary>
    public int PriceCents { get; set; }

    public int GoingCount { get; set; }
    public bool IsSoldOut { get; set; }
    public bool IsFeatured { get; set; }
    public string? TicketUrl { get; set; }
    public string? StreamUrl { get; set; }
    public string? RecordingUrl { get; set; }
    public string? SubmitterEmail { get; set; }
    public DateTimeOffset? SubmittedAtUtc { get; set; }
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public DateTimeOffset? CancelledAtUtc { get; set; }
    public string? CancellationReason { get; set; }

    /// <summary>Short note after the price, e.g. "includes lunch".</summary>
    public string? PriceNote { get; set; }

    /// <summary>More price detail, e.g. "Student tickets $15 with a valid ID".</summary>
    public string? PriceDetail { get; set; }

    /// <summary>What the stream covers or where it streams, e.g. "YouTube and Microsoft Learn".</summary>
    public string? LivestreamNote { get; set; }

    public int? Capacity { get; set; }
    public int? AttendedCount { get; set; }
    public string? SlidesUrl { get; set; }

    /// <summary>The start before the organizer last changed it.</summary>
    public DateTimeOffset? PreviousStartsAtUtc { get; set; }

    public DateTimeOffset? TimeChangedAtUtc { get; set; }
    /// <summary>When the organizer confirmed the date, venue and stream.</summary>
    public DateTimeOffset? ConfirmedAtUtc { get; set; }
    public string? NoteTitle { get; set; }
    public string? NoteText { get; set; }

    public List<AgendaItem> AgendaItems { get; set; } = [];

    public List<EventSpeaker> Speakers { get; set; } = [];

    public bool IsCancelled => CancelledAtUtc is not null;

    public bool IsPast(DateTimeOffset now) => EndsAtUtc <= now;
}
