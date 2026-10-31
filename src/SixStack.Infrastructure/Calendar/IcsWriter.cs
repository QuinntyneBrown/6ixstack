using System.Globalization;
using System.Text;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Infrastructure.Calendar;

/// <summary>
/// RFC 5545 writer. Times carry <c>TZID=America/Toronto</c> with a matching VTIMEZONE, so calendar apps in other zones
/// convert them correctly (L2-037). Text is escaped and lines are folded at 75 octets.
/// </summary>
public sealed class IcsWriter(IOptions<SiteOptions> site, IClock clock) : IIcsWriter
{
    private const string TorontoTimeZone = """
        BEGIN:VTIMEZONE
        TZID:America/Toronto
        BEGIN:DAYLIGHT
        TZOFFSETFROM:-0500
        TZOFFSETTO:-0400
        TZNAME:EDT
        DTSTART:19700308T020000
        RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
        END:DAYLIGHT
        BEGIN:STANDARD
        TZOFFSETFROM:-0400
        TZOFFSETTO:-0500
        TZNAME:EST
        DTSTART:19701101T020000
        RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
        END:STANDARD
        END:VTIMEZONE
        """;

    public string WriteSingleEvent(Event e) => Write(null, [e]);

    public string WriteCalendar(string name, IEnumerable<Event> events) => Write(name, events);

    private string Write(string? name, IEnumerable<Event> events)
    {
        var lines = new List<string> { "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//6ixstack//Events//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH" };
        if (name is not null)
        {
            lines.Add($"X-WR-CALNAME:{Escape(name)}");
            lines.Add("X-WR-TIMEZONE:America/Toronto");
        }

        lines.AddRange(TorontoTimeZone.Split('\n').Select(l => l.TrimEnd('\r')));
        foreach (var e in events)
        {
            lines.AddRange(Event(e));
        }

        lines.Add("END:VCALENDAR");

        var builder = new StringBuilder();
        foreach (var line in lines)
        {
            Fold(builder, line);
        }

        return builder.ToString();
    }

    private IEnumerable<string> Event(Event e)
    {
        var url = $"{site.Value.PublicBaseUrl.TrimEnd('/')}/events/{e.Slug}";
        var location = e.Format == EventFormat.Streaming || e.Venue is null
            ? "Streaming online"
            : string.Join(", ", new[] { e.Venue.Name, e.Venue.Address, e.Venue.City }.Where(p => !string.IsNullOrWhiteSpace(p)));
        var description = $"{e.Description}\n\n{e.Community?.Name}\n{url}";

        yield return "BEGIN:VEVENT";
        yield return $"UID:{e.Id}@6ixstack.dev";
        yield return $"SEQUENCE:{e.Sequence}";
        yield return $"DTSTAMP:{clock.UtcNow.UtcDateTime.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture)}";
        yield return $"DTSTART;TZID=America/Toronto:{Local(e.StartsAtUtc)}";
        yield return $"DTEND;TZID=America/Toronto:{Local(e.EndsAtUtc)}";
        yield return $"SUMMARY:{Escape(e.Title)}";
        yield return $"LOCATION:{Escape(location)}";
        yield return $"DESCRIPTION:{Escape(description)}";
        yield return $"URL:{url}";
        yield return $"STATUS:{(e.IsCancelled ? "CANCELLED" : "CONFIRMED")}";
        yield return "END:VEVENT";
    }

    private static string Local(DateTimeOffset utc) =>
        TorontoTime.ToLocal(utc).ToString("yyyyMMdd'T'HHmmss", CultureInfo.InvariantCulture);

    /// <summary>RFC 5545 §3.3.11: backslash, semicolon, comma and newline are escaped.</summary>
    internal static string Escape(string text) => text
        .Replace("\\", "\\\\", StringComparison.Ordinal)
        .Replace(";", "\\;", StringComparison.Ordinal)
        .Replace(",", "\\,", StringComparison.Ordinal)
        .Replace("\r\n", "\\n", StringComparison.Ordinal)
        .Replace("\n", "\\n", StringComparison.Ordinal);

    /// <summary>RFC 5545 §3.1: lines longer than 75 octets continue on the next line after CRLF and a space.</summary>
    private static void Fold(StringBuilder builder, string line)
    {
        var limit = 75;
        var octets = 0;
        foreach (var rune in line.EnumerateRunes())
        {
            var size = rune.Utf8SequenceLength;
            if (octets + size > limit)
            {
                builder.Append("\r\n ");
                octets = 1;
                limit = 75;
            }

            builder.Append(rune.ToString());
            octets += size;
        }

        builder.Append("\r\n");
    }
}
