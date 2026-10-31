using System.Globalization;
using SixStack.Application.Common;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Events;

/// <summary>
/// The rules of the event detail page (L2-017 to L2-023): its state, facts, actions, alerts and docked bar,
/// so the web app renders a ready-made model.
/// </summary>
public static class EventDetailPolicy
{
    public static readonly TimeSpan JoinWindow = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan TimeChangeAlertFor = TimeSpan.FromDays(7);
    public const string TicketsCaption = "Tickets are sold by the organizer. 6ixstack never charges attendees.";

    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public static EventDetailDto Build(Event e, Event? nextEvent, DateTimeOffset now, string publicBaseUrl)
    {
        // A new organizer's approved event has no community yet; it goes by the organizer name it was submitted with.
        var community = e.Community ?? new Community { Name = e.OrganizerName ?? "the organizer" };
        var state = e.IsCancelled ? "cancelled" : e.IsPast(now) ? "past" : "upcoming";
        var upcoming = state == "upcoming";
        var startLocal = TorontoTime.ToLocal(e.StartsAtUtc);
        var day = DateOnly.FromDateTime(startLocal);

        var when = new WhenFactDto(
            startLocal.ToString("dddd, MMMM d, yyyy", En),
            $"{TorontoTime.Time(e.StartsAtUtc)} – {TorontoTime.Time(e.EndsAtUtc)} ET",
            e.Format == EventFormat.Streaming && e.SourceTimeZoneId is not null ? TorontoTime.TimeIn(e.StartsAtUtc, e.SourceTimeZoneId) : null,
            state switch { "past" => "ended", "cancelled" => "cancelled", _ => null });

        VenueFactDto? venue = null;
        if (e.Format != EventFormat.Streaming && e.Venue is not null)
        {
            var address = string.IsNullOrWhiteSpace(e.Venue.Address) ? e.Venue.City : $"{e.Venue.Address}, {e.Venue.City}";
            var query = Uri.EscapeDataString($"{e.Venue.Name}, {address}");
            venue = new VenueFactDto(e.Venue.Name, address, $"https://www.google.com/maps/search/?api=1&query={query}", e.Venue.TravelNotes, e.Venue.City, e.Venue.Latitude, e.Venue.Longitude);
        }

        LabelledFactDto? stream = e.Format switch
        {
            EventFormat.Streaming => new("Streaming online", e.LivestreamNote),
            EventFormat.Hybrid => new("Livestream available", e.LivestreamNote),
            _ => null,
        };

        var amount = EventLabels.Amount(e);
        LabelledFactDto? price = upcoming ? new(e.PriceNote is null ? amount : $"{amount} · {e.PriceNote}", e.PriceDetail) : null;
        LabelledFactDto? attendance = state switch
        {
            "upcoming" => new($"{Count(e.GoingCount)} going", e.Capacity is null ? null : $"Capacity {Count(e.Capacity.Value)}"),
            "past" => new($"{Count(e.AttendedCount ?? e.GoingCount)} attended", null),
            _ => null,
        };

        var actions = Actions(e, state, amount, now, community);
        var alerts = Alerts(e, state, nextEvent, now, community);
        DockedBarDto? docked = upcoming && actions.Primary is not null
            ? new DockedBarDto(
                $"{startLocal.ToString("ddd, MMM d", En)} · {TorontoTime.Time(e.StartsAtUtc)}",
                $"{amount} · {Count(e.GoingCount)} going",
                new PrimaryActionDto(e.PriceCents > 0 ? "Get tickets" : "Register", actions.Primary.Url))
            : null;

        var place = e.Format == EventFormat.Streaming || e.Venue is null ? "Streaming online" : e.Venue.Name;
        var url = $"{publicBaseUrl.TrimEnd('/')}/events/{e.Slug}";
        var calendar = new CalendarDto(
            $"{e.Title} · {startLocal.ToString("ddd, MMM d", En)}, {TorontoTime.Time(e.StartsAtUtc)} – {TorontoTime.Time(e.EndsAtUtc)} ET · {place}",
            e.StartsAtUtc,
            e.EndsAtUtc,
            venue is null ? "Streaming online" : $"{venue.Name}, {venue.Address}",
            $"{e.Description}\n\n{url}");

        return new EventDetailDto(
            e.Slug,
            e.Title,
            e.Description,
            state,
            EventLabels.Format(e.Format),
            new CommunityLinkDto(e.Community?.Slug, community.Name),
            TopicKeys.Of(e.Topics),
            new DateTileDto(startLocal.ToString("MMM", En), day.Day.ToString(En)),
            new EventFactsDto(when, venue, stream, price, attendance),
            [.. e.AgendaItems.OrderBy(a => a.Order).Select(a => new AgendaItemDto(a.StartsAtLocal.ToString("h:mm tt", En), a.Title))],
            [.. e.Speakers.OrderBy(s => s.Order).Select(s => new SpeakerSummaryDto(s.Speaker!.Slug, s.Speaker.Name, s.Speaker.Initials, s.Speaker.Role))],
            actions,
            alerts,
            docked,
            calendar);
    }

    private static EventActionsDto Actions(Event e, string state, string amount, DateTimeOffset now, Community community)
    {
        if (state == "cancelled")
        {
            var topics = TopicKeys.Of(e.Topics);
            var names = string.Join(" or ", topics.Select(TopicKeys.Label));
            return new EventActionsDto(null, null, false, false, false, null, null, null,
                new LinkDto(topics.Count == 0 ? "Find another event" : $"Find another {names} event", topics.Count == 0 ? "/" : $"/?topics={string.Join(',', topics)}"),
                e.Community is null ? null : new LinkDto($"Follow {community.Name}", $"/communities/{community.Slug}"));
        }

        if (state == "past")
        {
            return new EventActionsDto(null, null, false, false, true, null, e.RecordingUrl, e.SlidesUrl, null, null);
        }

        PrimaryActionDto? primary = e.Format != EventFormat.Streaming && e.TicketUrl is not null
            ? new PrimaryActionDto(e.PriceCents > 0 ? $"Get tickets · {amount}" : "Register", e.TicketUrl)
            : null;
        JoinActionDto? join = null;
        if (e.Format == EventFormat.Streaming)
        {
            var opens = e.StartsAtUtc - JoinWindow;
            join = new JoinActionDto("Join the stream", opens, now >= opens ? e.StreamUrl : null);
        }

        return new EventActionsDto(primary, join, true, true, true, TicketsCaption, null, null, null, null);
    }

    private static List<EventAlertDto> Alerts(Event e, string state, Event? next, DateTimeOffset now, Community community)
    {
        var alerts = new List<EventAlertDto>();
        if (state == "cancelled")
        {
            var on = TorontoTime.MonthDay(TorontoTime.Today(e.CancelledAtUtc!.Value));
            alerts.Add(new("danger", $"Cancelled by the organizer on {on}",
                string.IsNullOrWhiteSpace(e.CancellationReason) ? null : $"“{e.CancellationReason}” — {community.Name}", null));
            return alerts;
        }

        if (state == "past")
        {
            alerts.Add(next is null
                ? new("info", "This event has ended", null, null)
                : new("info", "This event has ended",
                    $"{community.Name} meets again on {TorontoTime.MonthDay(DateOnly.FromDateTime(TorontoTime.ToLocal(next.StartsAtUtc)))}.",
                    new AlertActionDto("See the next one", $"/events/{next.Slug}", null)));
            return alerts;
        }

        if (e.Format == EventFormat.Streaming && now < e.StartsAtUtc - JoinWindow)
        {
            alerts.Add(new("info", Countdown(e.StartsAtUtc, now),
                $"We'll show the stream link here 15 minutes before {TorontoTime.Time(e.StartsAtUtc)} ET.", null));
        }

        if (e.TimeChangedAtUtc is { } changed && now - changed <= TimeChangeAlertFor && now >= changed)
        {
            alerts.Add(new("warning", $"Start time changed to {TorontoTime.Time(e.StartsAtUtc)}",
                $"Updated by {community.Name} {Ago(now - changed)}. Calendar feeds update automatically; re-add it if you saved a file.",
                new AlertActionDto("Update my calendar", null, "add-to-calendar")));
        }

        if (e.IsSoldOut)
        {
            var gone = e.Capacity is null ? "All tickets are gone." : $"All {Count(e.Capacity.Value)} tickets are gone.";
            var rest = e.Format == EventFormat.Hybrid ? "; the livestream is still free." : ".";
            alerts.Add(new("danger", "Sold out", $"{gone} Join the waitlist on the ticket page{rest}",
                e.TicketUrl is null ? null : new AlertActionDto("Join the waitlist", e.TicketUrl, null)));
        }

        if (e.ConfirmedAtUtc is { } confirmed)
        {
            var what = e.Format switch
            {
                EventFormat.Hybrid => "the date, venue and livestream",
                EventFormat.Streaming => "the date and stream",
                _ => "the date and venue",
            };
            alerts.Add(new("success", "Confirmed by the organizer",
                $"{community.Name} confirmed {what} on {TorontoTime.MonthDay(TorontoTime.Today(confirmed))}.", null));
        }

        if (!string.IsNullOrWhiteSpace(e.NoteTitle))
        {
            alerts.Add(new("info", e.NoteTitle, e.NoteText, null));
        }

        return alerts;
    }

    private static string Countdown(DateTimeOffset start, DateTimeOffset now)
    {
        var days = TorontoTime.Today(start).DayNumber - TorontoTime.Today(now).DayNumber;
        if (days >= 1)
        {
            return days == 1 ? "Starts tomorrow" : $"Starts in {days} days";
        }

        var hours = (int)Math.Floor((start - now).TotalHours);
        return hours >= 1 ? $"Starts in {hours} {(hours == 1 ? "hour" : "hours")}" : "Starts in less than an hour";
    }

    private static string Ago(TimeSpan span) =>
        span.TotalDays >= 1 ? Plural((int)span.TotalDays, "day")
        : span.TotalHours >= 1 ? Plural((int)span.TotalHours, "hour")
        : span.TotalMinutes >= 1 ? Plural((int)span.TotalMinutes, "minute")
        : "just now";

    private static string Plural(int n, string unit) => $"{n} {unit}{(n == 1 ? string.Empty : "s")} ago";

    private static string Count(int n) => n.ToString("N0", En);
}
