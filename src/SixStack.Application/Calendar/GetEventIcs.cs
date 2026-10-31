using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Application.Calendar;

public sealed record IcsFileDto(string FileName, string Content);

public sealed record GetEventIcsQuery(string Slug) : IRequest<IcsFileDto>;

/// <summary>A single-event .ics for a published (possibly cancelled) event; anything else is not found (L2-037).</summary>
public sealed class GetEventIcsQueryHandler(IAppDbContext db, IIcsWriter writer) : IRequestHandler<GetEventIcsQuery, IcsFileDto>
{
    public async Task<IcsFileDto> Handle(GetEventIcsQuery request, CancellationToken cancellationToken)
    {
        var e = await db.Events.AsNoTracking()
            .Include(x => x.Community)
            .SingleOrDefaultAsync(x => x.Slug == request.Slug && x.Status == EventStatus.Published, cancellationToken)
            ?? throw new NotFoundException($"Event {request.Slug} was not found");

        return new IcsFileDto($"{e.Slug}.ics", writer.WriteSingleEvent(e));
    }
}
