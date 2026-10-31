using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Application.Common;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Organizer;

/// <summary>The edit form's values; names match the form's controls and the update body.</summary>
public sealed record EventDetailsFormDto(
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
    string? TicketUrl);

public sealed record EventEditDto(
    Guid Id,
    string Slug,
    string Title,
    string Status,
    string StatusLine,
    bool IsReadOnly,
    string? ReadOnlyLead,
    int GoingCount,
    EventDetailsFormDto Details,
    bool IsPaid,
    int EmailableAttendees,
    string? CancellationReason,
    string? CancelledOnLabel);

/// <summary>An event for the edit page (L2-054, L2-055).</summary>
public sealed record GetOrganizerEventQuery(Guid Id) : IRequest<EventEditDto>;

public sealed class GetOrganizerEventQueryHandler(IAppDbContext db, IClock clock, EventAccess access, IAttendeeDirectory attendees)
    : IRequestHandler<GetOrganizerEventQuery, EventEditDto>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<EventEditDto> Handle(GetOrganizerEventQuery request, CancellationToken cancellationToken)
    {
        var e = await db.Events.AsNoTracking().Include(x => x.Community).SingleOrDefaultAsync(x => x.Id == request.Id && x.Status != EventStatus.Deleted, cancellationToken)
            ?? throw new NotFoundException("Event not found.");
        await access.DemandAsync(e, cancellationToken);
        return ToDto(e, clock.UtcNow, (await attendees.EmailsGoingToAsync(e.Id, cancellationToken)).Count);
    }

    public static string StatusName(Event e, DateTimeOffset now) => e.Status switch
    {
        _ when e.IsCancelled => "cancelled",
        EventStatus.Published when e.IsPast(now) => "past",
        EventStatus.Published => "published",
        EventStatus.InReview => "inReview",
        EventStatus.NeedsChanges => "needsChanges",
        EventStatus.Rejected => "notApproved",
        _ => "draft",
    };

    public static EventEditDto ToDto(Event e, DateTimeOffset now, int emailableAttendees)
    {
        var status = StatusName(e, now);
        var label = status switch
        {
            "cancelled" => "Cancelled",
            "past" => "Past",
            "published" => "Published",
            "inReview" => "In review",
            "needsChanges" => "Needs changes",
            "notApproved" => "Not approved",
            _ => "Draft",
        };
        var parts = new List<string> { label };
        if (status == "published")
        {
            parts.Add($"{e.GoingCount.ToString("N0", En)} going");
        }

        if (e.LastEditedAtUtc is { } edited)
        {
            parts.Add($"last edited {TorontoTime.ToLocal(edited).ToString("MMM d", En)}");
        }

        var start = TorontoTime.ToLocal(e.StartsAtUtc);
        var readOnly = e.IsPast(now) || e.IsCancelled;
        var people = e.AttendedCount is { } attended ? $"{attended.ToString("N0", En)} attended" : $"{e.GoingCount.ToString("N0", En)} going";
        var zone = TimeZoneInfo.FindSystemTimeZoneById(e.TimeZoneId);
        var local = TimeZoneInfo.ConvertTime(e.StartsAtUtc, zone);
        var end = TimeZoneInfo.ConvertTime(e.EndsAtUtc, zone);
        var details = new EventDetailsFormDto(
            e.Title,
            e.OrganizerName ?? e.Community?.Name ?? string.Empty,
            e.Description,
            TopicKeys.Of(e.Topics),
            local.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            e.TimeZoneId,
            local.ToString("HH:mm", CultureInfo.InvariantCulture),
            end.ToString("HH:mm", CultureInfo.InvariantCulture),
            e.Format switch { EventFormat.Streaming => "streaming", EventFormat.Hybrid => "hybrid", _ => "inPerson" },
            e.Venue?.Name,
            e.Venue?.City,
            e.Venue?.Address,
            e.StreamUrl,
            e.PriceCents == 0,
            e.PriceCents == 0 ? null : e.PriceCents / 100m,
            e.TicketUrl);
        return new EventEditDto(
            e.Id,
            e.Slug,
            e.Title,
            status,
            string.Join(" · ", parts),
            readOnly,
            readOnly ? $"{start.ToString("dddd, MMMM d, yyyy", En)} · {people}" : null,
            e.GoingCount,
            details,
            e.PriceCents > 0,
            emailableAttendees,
            e.CancellationReason,
            e.CancelledAtUtc is { } cancelled ? TorontoTime.ToLocal(cancelled).ToString("MMM d", En) : null);
    }
}
