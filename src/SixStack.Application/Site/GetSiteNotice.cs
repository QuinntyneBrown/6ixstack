using MediatR;
using Microsoft.Extensions.Options;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Application.Site;

public sealed record MaintenanceNoticeDto(string WindowId, DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc, string Title, string Text);

/// <summary>The maintenance notice to show as a site banner, or null when none is announced or it has ended (L2-075).</summary>
public sealed record GetSiteNoticeQuery : IRequest<MaintenanceNoticeDto?>;

public sealed class GetSiteNoticeHandler(IOptions<MaintenanceOptions> options, IClock clock) : IRequestHandler<GetSiteNoticeQuery, MaintenanceNoticeDto?>
{
    public Task<MaintenanceNoticeDto?> Handle(GetSiteNoticeQuery request, CancellationToken cancellationToken)
    {
        var o = options.Value;
        if (string.IsNullOrWhiteSpace(o.WindowId) || string.IsNullOrWhiteSpace(o.Title)
            || o.StartsAtUtc is null || o.EndsAtUtc is null || o.EndsAtUtc <= clock.UtcNow)
        {
            return Task.FromResult<MaintenanceNoticeDto?>(null);
        }

        return Task.FromResult<MaintenanceNoticeDto?>(new MaintenanceNoticeDto(o.WindowId, o.StartsAtUtc.Value, o.EndsAtUtc.Value, o.Title, o.Text ?? string.Empty));
    }
}
