using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Domain.Entities;

namespace SixStack.Application.EventAdmin;

/// <summary>Finds an event by id or slug: a <see cref="Guid"/> matches the id, anything else the slug.</summary>
public static class AdminEventLookup
{
    public static IQueryable<Event> Matching(this IQueryable<Event> events, string idOrSlug) =>
        Guid.TryParse(idOrSlug, out var id) ? events.Where(e => e.Id == id) : events.Where(e => e.Slug == idOrSlug);

    public static async Task<Event> FindAsync(IQueryable<Event> events, string idOrSlug, CancellationToken cancellationToken) =>
        await events.Matching(idOrSlug).SingleOrDefaultAsync(cancellationToken) ?? throw NotFound(idOrSlug);

    public static NotFoundException NotFound(string idOrSlug) => new($"No event matches '{idOrSlug}'.");
}
