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

    public static string Price(Event e) =>
        e.IsSoldOut ? "Sold out"
        : e.PriceCents == 0 ? "Free"
        : e.PriceCents % 100 == 0 ? $"${(e.PriceCents / 100).ToString(CultureInfo.InvariantCulture)}"
        : $"${(e.PriceCents / 100m).ToString("0.00", CultureInfo.InvariantCulture)}";
}
