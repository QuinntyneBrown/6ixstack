using MediatR;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Organizer;
using SixStack.Application.Submissions;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.EventAdmin;

/// <summary>The result of an <c>events</c> write, or of its preview when <c>DryRun</c> is true (L2-110).</summary>
public sealed record AdminWriteResultDto(string Action, bool DryRun, IReadOnlyList<string> Changes, AdminEventSummaryDto Event);

/// <summary>
/// <c>events add</c> (L2-107): the submit and edit forms' details; with <c>Apply</c> false it validates and previews
/// without writing (L2-111).
/// </summary>
public sealed record AddAdminEventCommand(
    string? Title,
    string? OrganizerName,
    string? Description,
    IReadOnlyList<string>? Topics,
    string? Date,
    string? TimeZoneId,
    string? StartTime,
    string? EndTime,
    string? Format,
    string? VenueName,
    string? City,
    string? StreetAddress,
    string? StreamUrl,
    bool IsFree,
    decimal? PriceCad,
    string? TicketUrl,
    bool Apply) : IRequest<AdminWriteResultDto>, IEventDetailsInput
{
    public bool HasVenue => Format is "inPerson" or "hybrid";

    public EventDetailsFormDto ToForm() => new(
        Title ?? string.Empty, OrganizerName ?? string.Empty, Description ?? string.Empty, Topics ?? [], Date ?? string.Empty,
        TimeZoneId ?? string.Empty, StartTime ?? string.Empty, EndTime ?? string.Empty, Format ?? string.Empty,
        VenueName, City, StreetAddress, StreamUrl, IsFree, PriceCad, TicketUrl);

    public static AddAdminEventCommand From(EventDetailsPatch patch, bool apply)
    {
        var f = patch.ApplyTo(EventDetailsPatch.Blank);
        return new AddAdminEventCommand(
            f.Title, f.OrganizerName, f.Description, f.Topics, f.Date, f.TimeZoneId, f.StartTime, f.EndTime, f.Format,
            f.VenueName, f.City, f.StreetAddress, f.StreamUrl, f.IsFree, f.PriceCad, f.TicketUrl, apply);
    }
}

/// <summary>The L2-041 and L2-042 rules the submit and edit forms apply.</summary>
public sealed class AddAdminEventCommandValidator(IClock clock) : EventDetailsValidator<AddAdminEventCommand>(clock);

/// <summary>
/// Creates the event published, as the moderator actor's approval, with no submitter email, and records
/// <c>EventAdded</c> in the same unit of work (ADR 0011, L2-112).
/// </summary>
public sealed class AddAdminEventCommandHandler(IAppDbContext db, IClock clock, IAuditLog audit)
    : IRequestHandler<AddAdminEventCommand, AdminWriteResultDto>
{
    public async Task<AdminWriteResultDto> Handle(AddAdminEventCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var d = ((IEventDetailsInput)request).ToDetails();
        var e = EventSlugs.NewEvent(d, await EventSlugs.UniqueAsync(db, d.Title, cancellationToken));
        e.Status = EventStatus.Published;
        e.ApprovedAtUtc = now;
        e.PublishedAtUtc = now;
        var changes = EventDetailsPatch.ChangedFields(EventDetailsPatch.Empty, request.ToForm());
        var result = new AdminWriteResultDto("added", !request.Apply, changes, AdminEventSummaryDto.From(e));
        if (!request.Apply)
        {
            return result;
        }

        db.Events.Add(e);
        audit.Record("EventAdded", nameof(Event), e.Id, "published");
        await db.SaveChangesAsync(cancellationToken);
        return result;
    }
}
