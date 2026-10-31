using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Application.Sharing;

/// <summary>The page a short link opens; null for an unknown or unpublished event, so it never reveals one (L2-038).</summary>
public sealed record ResolveShortLinkQuery(string Slug) : IRequest<string?>;

public sealed class ResolveShortLinkQueryHandler(IAppDbContext db) : IRequestHandler<ResolveShortLinkQuery, string?>
{
    public async Task<string?> Handle(ResolveShortLinkQuery request, CancellationToken cancellationToken) =>
        await db.Events.AsNoTracking().AnyAsync(e => e.Slug == request.Slug && e.Status == EventStatus.Published, cancellationToken)
            ? $"/events/{request.Slug}"
            : null;
}
