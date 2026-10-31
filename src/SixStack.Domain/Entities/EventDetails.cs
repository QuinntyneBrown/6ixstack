using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

/// <summary>The editable details of a listing (edit-event design: "event details").</summary>
public sealed record EventDetails(
    string Title,
    string OrganizerName,
    string Description,
    Topics Topics,
    EventFormat Format,
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    string TimeZoneId,
    string? VenueName,
    string? StreetAddress,
    string? City,
    string? StreamUrl,
    int PriceCents,
    string? TicketUrl);
