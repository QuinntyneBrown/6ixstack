using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixStack.Application.Events;

namespace SixStack.Infrastructure.Checks;

/// <summary>Sends <see cref="LocateVenuesCommand"/> shortly after start-up and then every interval (ADR 0013).</summary>
public sealed class VenueGeocodingJob(IServiceScopeFactory scopes, IOptions<GeocodingOptions> options, ILogger<VenueGeocodingJob> logger)
    : BackgroundService
{
    private static readonly TimeSpan FirstRunDelay = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled)
        {
            return;
        }

        var interval = options.Value.Interval > TimeSpan.Zero ? options.Value.Interval : TimeSpan.FromMinutes(5);
        var wait = interval < FirstRunDelay ? interval : FirstRunDelay;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(wait, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                return;
            }

            wait = interval;
            try
            {
                using var scope = scopes.CreateScope();
                var located = await scope.ServiceProvider.GetRequiredService<ISender>().Send(new LocateVenuesCommand(), stoppingToken);
                if (located > 0)
                {
                    logger.LogInformation("Located {Count} venues", located);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Locating venues failed");
            }
        }
    }
}
