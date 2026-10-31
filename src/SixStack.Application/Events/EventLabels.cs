using System.Globalization;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Events;

/// <summary>Display labels shared by every event list, so the web app holds no formatting rules.</summary>
public static class EventLabels
{
    public static string Format(EventFormat format) => format switch
    {
        EventFormat.InPerson => "inPerson",
        EventFormat.Streaming => "streaming",
        _ => "hybrid",
    };

    /// <summary>"Microsoft Canada, 81 Bay St, Toronto" for a venue, "Streaming online" for a stream.</summary>
    public static string Location(Event e) =>
        e.Format == EventFormat.Streaming || e.Venue is null ? "Streaming online" : $"{e.Venue.Name}, {e.Venue.City}";

    public static string Price(Event e) => e.IsSoldOut ? "Sold out" : Amount(e);

    /// <summary>"Free", "$49" or "$1,250", ignoring whether it is sold out.</summary>
    public static string Amount(Event e) =>
        e.PriceCents == 0 ? "Free"
        : e.PriceCents % 100 == 0 ? $"${(e.PriceCents / 100).ToString("N0", En)}"
        : $"${(e.PriceCents / 100m).ToString("N2", En)}";

    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");
}
