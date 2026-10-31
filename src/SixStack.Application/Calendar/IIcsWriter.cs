using SixStack.Domain.Entities;

namespace SixStack.Application.Calendar;

/// <summary>Writes iCalendar (RFC 5545) for single events and, later, feeds (feeds-and-sharing/serve-calendar-feed).</summary>
public interface IIcsWriter
{
    /// <summary>One VCALENDAR with the America/Toronto VTIMEZONE and one VEVENT.</summary>
    string WriteSingleEvent(Event e);

    /// <summary>A whole feed: one VCALENDAR named <paramref name="name"/> with a VEVENT per event (L2-036).</summary>
    string WriteCalendar(string name, IEnumerable<Event> events);
}
