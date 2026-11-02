using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Application.Events;

/// <summary>Gives upcoming GTA venues without coordinates a point on the map (event-map design, ADR 0013).</summary>
public sealed record LocateVenuesCommand : IRequest<int>
{
    public const int BatchSize = 50;
}

/// <summary>
/// Locates up to <see cref="LocateVenuesCommand.BatchSize"/> published, not-cancelled, not-yet-started in-person or
/// hybrid events whose venue has no coordinates, and returns how many it located. A venue the locator cannot answer
/// for now keeps no coordinates and is tried again on the next run.
/// </summary>
public sealed class LocateVenuesCommandHandler(IAppDbContext db, IClock clock, IVenueLocator locator) : IRequestHandler<LocateVenuesCommand, int>
{
    public async Task<int> Handle(LocateVenuesCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var events = (await db.Events
                .Where(e => e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.Format != EventFormat.Streaming
                    && e.Venue != null && e.Venue.Latitude == null && e.StartsAtUtc >= now)
                .ToListAsync(cancellationToken))
            .OrderBy(e => e.StartsAtUtc)
            .Take(LocateVenuesCommand.BatchSize)
            .ToList();
        var located = 0;
        foreach (var e in events)
        {
            var point = await locator.LocateAsync(e.Venue!.Address ?? string.Empty, e.Venue.City, cancellationToken);
            if (point is null)
            {
                continue;
            }

            e.Venue.Latitude = point.Latitude;
            e.Venue.Longitude = point.Longitude;
            located++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return located;
    }
}
