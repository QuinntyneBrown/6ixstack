using System.Text.Json.Serialization;
using SixStack.Application.Organizer;
using SixStack.Domain.Entities;

namespace SixStack.Application.EventAdmin;

/// <summary>One row of <c>events list</c>; never carries contact details (L2-105, L2-113).</summary>
public sealed record AdminEventSummaryDto(
    Guid Id,
    string Slug,
    string Title,
    string Status,
    bool Cancelled,
    string Format,
    string? OrganizerName,
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc)
{
    public static AdminEventSummaryDto From(Event e) => new(
        e.Id,
        e.Slug,
        e.Title,
        AdminEventStatus.Name(e.Status),
        e.IsCancelled,
        FormatName(e),
        e.OrganizerName ?? e.Community?.Name,
        e.StartsAtUtc,
        e.EndsAtUtc);

    public static string FormatName(Event e) => e.Format switch
    {
        Domain.Enums.EventFormat.Streaming => "streaming",
        Domain.Enums.EventFormat.Hybrid => "hybrid",
        _ => "inPerson",
    };
}

public sealed record AdminEventListDto(int Count, IReadOnlyList<AdminEventSummaryDto> Events);

/// <summary>
/// One event for <c>events get</c> (L2-106): its identity and state, then the edit form's fields under the names
/// <c>events add</c> and <c>events update</c> accept. <c>SubmitterEmail</c> is set only when asked for (L2-113).
/// </summary>
public sealed record AdminEventDto(
    Guid Id,
    string Slug,
    string Status,
    bool Cancelled,
    string? CancellationReason,
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    Guid Version,
    string Title,
    string OrganizerName,
    string Description,
    IReadOnlyList<string> Topics,
    string Date,
    string TimeZoneId,
    string StartTime,
    string EndTime,
    string Format,
    string? VenueName,
    string? City,
    string? StreetAddress,
    string? StreamUrl,
    bool IsFree,
    decimal? PriceCad,
    string? TicketUrl,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? SubmitterEmail)
{
    public static AdminEventDto From(Event e, DateTimeOffset now, bool includeContact)
    {
        var d = GetOrganizerEventQueryHandler.ToDto(e, now, 0).Details;
        return new AdminEventDto(
            e.Id, e.Slug, AdminEventStatus.Name(e.Status), e.IsCancelled, e.CancellationReason, e.StartsAtUtc, e.EndsAtUtc, e.Version,
            d.Title, d.OrganizerName, d.Description, d.Topics, d.Date, d.TimeZoneId, d.StartTime, d.EndTime, d.Format,
            d.VenueName, d.City, d.StreetAddress, d.StreamUrl, d.IsFree, d.PriceCad, d.TicketUrl,
            includeContact ? e.SubmitterEmail : null);
    }
}
