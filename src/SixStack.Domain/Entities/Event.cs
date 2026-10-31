using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    /// <summary>The community that runs it; a new submission has none until moderation links it.</summary>
    public Guid? CommunityId { get; set; }
    public Community? Community { get; set; }

    /// <summary>The community or organizer as the submitter typed it.</summary>
    public string? OrganizerName { get; set; }

    /// <summary>When a moderator approved it; an unverified submitter's event waits in review until verification (L2-085).</summary>
    public DateTimeOffset? ApprovedAtUtc { get; set; }
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

    /// <summary>When the details were last saved from the edit page (the status line's "last edited").</summary>
    public DateTimeOffset? LastEditedAtUtc { get; set; }
    /// <summary>When the organizer confirmed the date, venue and stream.</summary>
    public DateTimeOffset? ConfirmedAtUtc { get; set; }
    public string? NoteTitle { get; set; }
    public string? NoteText { get; set; }

    public List<AgendaItem> AgendaItems { get; set; } = [];

    public List<EventSpeaker> Speakers { get; set; } = [];

    public bool IsCancelled => CancelledAtUtc is not null;

    public bool IsPast(DateTimeOffset now) => EndsAtUtc <= now;

    /// <summary>The iCalendar SEQUENCE: raised when the start or end time changes, so calendar apps update (L2-036).</summary>
    public int Sequence { get; set; }

    /// <summary>Changes on every moderation decision, so racing decisions commit once (L2-063).</summary>
    public Guid Version { get; set; } = Guid.NewGuid();

    /// <summary>A moderator's approval: published now, or held until the sender verifies their email (L2-060, L2-085).</summary>
    public void Approve(DateTimeOffset now, bool senderVerified)
    {
        if (Status != EventStatus.InReview || ApprovedAtUtc is not null || IsCancelled)
        {
            throw new Exceptions.InvalidStatusTransitionException(Status, "approve");
        }

        ApprovedAtUtc = now;
        if (senderVerified)
        {
            Status = EventStatus.Published;
            PublishedAtUtc = now;
        }

        Version = Guid.NewGuid();
    }

    /// <summary>Undo within the window: back to In review, no longer public.</summary>
    public void UndoApproval()
    {
        if (ApprovedAtUtc is null || Status is not (EventStatus.Published or EventStatus.InReview))
        {
            throw new Exceptions.InvalidStatusTransitionException(Status, "undo the approval of");
        }

        Status = EventStatus.InReview;
        ApprovedAtUtc = null;
        PublishedAtUtc = null;
        Version = Guid.NewGuid();
    }

    /// <summary>Turns a submission down: a missing venue address asks for changes, anything else rejects (L2-061).</summary>
    public void Decline(RejectionReason reason)
    {
        if (Status != EventStatus.InReview || ApprovedAtUtc is not null || IsCancelled)
        {
            throw new Exceptions.InvalidStatusTransitionException(Status, "reject");
        }

        Status = reason == RejectionReason.MissingVenueAddress ? EventStatus.NeedsChanges : EventStatus.Rejected;
        Version = Guid.NewGuid();
    }

    /// <summary>
    /// Applies edited details and returns the names of the fields that changed. A published event's new start or end
    /// raises the time-change alert (L2-022) and the iCalendar SEQUENCE (L2-036). Past and cancelled events are
    /// read-only.
    /// </summary>
    public IReadOnlyList<string> Edit(EventDetails d, DateTimeOffset now)
    {
        if (IsPast(now) || IsCancelled)
        {
            throw new Exceptions.InvalidStatusTransitionException(Status, "edit");
        }

        var changed = new List<string>();
        void Set<T>(string name, T current, T next, Action<T> apply)
        {
            if (!EqualityComparer<T>.Default.Equals(current, next))
            {
                changed.Add(name);
                apply(next);
            }
        }

        var startsAt = StartsAtUtc;
        var endsAt = EndsAtUtc;
        Set("title", Title, d.Title, v => Title = v);
        // An unset organizer shows as the community's name, so saving that name back is not a change.
        Set("organizerName", OrganizerName ?? Community?.Name, d.OrganizerName, v => OrganizerName = v);
        Set("description", Description, d.Description, v => Description = v);
        Set("topics", Topics, d.Topics, v => Topics = v);
        Set("format", Format, d.Format, v => Format = v);
        Set("startTime", StartsAtUtc, d.StartsAtUtc, v => StartsAtUtc = v);
        Set("endTime", EndsAtUtc, d.EndsAtUtc, v => EndsAtUtc = v);
        Set("timeZoneId", TimeZoneId, d.TimeZoneId, v =>
        {
            TimeZoneId = v;
            SourceTimeZoneId = v == "America/Toronto" ? null : v;
        });
        Set("venueName", Venue?.Name, d.VenueName, _ => { });
        Set("streetAddress", Venue?.Address, d.StreetAddress, _ => { });
        Set("city", Venue?.City, d.City, _ => { });
        if (d.VenueName is null)
        {
            Venue = null;
        }
        else if (Venue is null || Venue.Name != d.VenueName || Venue.Address != d.StreetAddress || Venue.City != d.City)
        {
            // A moved venue loses its map position until it is placed again.
            var moved = Venue is null || Venue.Address != d.StreetAddress || Venue.City != d.City;
            Venue = new Venue
            {
                Name = d.VenueName,
                Address = d.StreetAddress,
                City = d.City ?? string.Empty,
                Latitude = moved ? null : Venue!.Latitude,
                Longitude = moved ? null : Venue!.Longitude,
                TravelNotes = moved ? null : Venue!.TravelNotes,
            };
        }

        Set("streamUrl", StreamUrl, d.StreamUrl, v => StreamUrl = v);
        Set("priceCad", PriceCents, d.PriceCents, v => PriceCents = v);
        Set("ticketUrl", TicketUrl, d.TicketUrl, v => TicketUrl = v);

        if (Status == EventStatus.Published && (startsAt != StartsAtUtc || endsAt != EndsAtUtc))
        {
            if (startsAt != StartsAtUtc)
            {
                PreviousStartsAtUtc = startsAt;
                TimeChangedAtUtc = now;
            }

            Sequence++;
        }

        LastEditedAtUtc = now;
        Version = Guid.NewGuid();
        return changed;
    }

    /// <summary>An organizer's save of a Needs changes or Rejected event: back to In review, keeping its place (L2-054, L2-061).</summary>
    public void Resubmit()
    {
        if (Status is not (EventStatus.NeedsChanges or EventStatus.Rejected))
        {
            throw new Exceptions.InvalidStatusTransitionException(Status, "resubmit");
        }

        Status = EventStatus.InReview;
        Version = Guid.NewGuid();
    }

    /// <summary>
    /// Cancels a published or waiting event (L2-056): it stays listed, marked cancelled with the reason, and a
    /// published event's SEQUENCE rises so calendar apps replace it. Past and cancelled events cannot be cancelled.
    /// </summary>
    public void Cancel(string reason, DateTimeOffset now)
    {
        if (IsPast(now) || IsCancelled || Status is not (EventStatus.Published or EventStatus.InReview))
        {
            throw new Exceptions.InvalidStatusTransitionException(Status, "cancel");
        }

        CancelledAtUtc = now;
        CancellationReason = reason;
        if (Status == EventStatus.Published)
        {
            Sequence++;
        }

        Version = Guid.NewGuid();
    }
}
