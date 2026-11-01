using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Enums;

namespace SixStack.Application.EventAdmin;

/// <summary>
/// <c>events list</c> (L2-105): one status, or every status but Deleted; Toronto dates inclusive on the start; search
/// on title or organizer; ordered by start.
/// </summary>
public sealed record ListAdminEventsQuery(EventStatus? Status, DateOnly? From, DateOnly? To, string? Search, int Take = ListAdminEventsQuery.DefaultTake)
    : IRequest<AdminEventListDto>
{
    public const int DefaultTake = 50;
    public const int MaxTake = 500;
}

public sealed class ListAdminEventsQueryHandler(IAppDbContext db) : IRequestHandler<ListAdminEventsQuery, AdminEventListDto>
{
    public async Task<AdminEventListDto> Handle(ListAdminEventsQuery request, CancellationToken cancellationToken)
    {
        var events = db.Events.AsNoTracking().Include(e => e.Community).AsQueryable();
        events = request.Status is { } status ? events.Where(e => e.Status == status) : events.Where(e => e.Status != EventStatus.Deleted);
        if (request.From is { } from)
        {
            var start = TorontoTime.StartOf(from);
            events = events.Where(e => e.StartsAtUtc >= start);
        }

        if (request.To is { } to)
        {
            var end = TorontoTime.StartOf(to.AddDays(1));
            events = events.Where(e => e.StartsAtUtc < end);
        }

        if (request.Search?.Trim().ToLowerInvariant() is { Length: > 0 } search)
        {
            events = events.Where(e => e.Title.ToLower().Contains(search)
                || (e.OrganizerName ?? (e.Community != null ? e.Community.Name : string.Empty)).ToLower().Contains(search));
        }

        var rows = await events.OrderBy(e => e.StartsAtUtc).ThenBy(e => e.Slug)
            .Take(Math.Clamp(request.Take, 1, ListAdminEventsQuery.MaxTake))
            .ToListAsync(cancellationToken);
        var matches = rows.Select(AdminEventSummaryDto.From).ToList();
        return new AdminEventListDto(matches.Count, matches);
    }
}
