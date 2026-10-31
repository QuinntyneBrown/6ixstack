using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Notifications;

namespace SixStack.Infrastructure.Notifications;

/// <summary>Runs the weekly summary every Monday at 8:00 AM Toronto time (email-notifications decisions).</summary>
public sealed class WeeklySummaryJob(IServiceScopeFactory scopes, IClock clock, ILogger<WeeklySummaryJob> logger) : BackgroundService
{
    private static readonly TimeZoneInfo Toronto = TimeZoneInfo.FindSystemTimeZoneById("America/Toronto");

    /// <summary>The next Monday 8:00 AM in Toronto after <paramref name="now"/>.</summary>
    public static DateTimeOffset NextRun(DateTimeOffset now)
    {
        var local = TimeZoneInfo.ConvertTime(now, Toronto);
        var days = ((int)DayOfWeek.Monday - (int)local.DayOfWeek + 7) % 7;
        var candidate = local.Date.AddDays(days).AddHours(8);
        if (candidate <= local.DateTime)
        {
            candidate = candidate.AddDays(7);
        }

        return new DateTimeOffset(candidate, Toronto.GetUtcOffset(candidate)).ToUniversalTime();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var wait = NextRun(clock.UtcNow) - clock.UtcNow;
            try
            {
                await Task.Delay(wait > TimeSpan.Zero ? wait : TimeSpan.FromMinutes(1), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                return;
            }

            try
            {
                using var scope = scopes.CreateScope();
                var queued = await scope.ServiceProvider.GetRequiredService<ISender>().Send(new SendWeeklySummariesCommand(), stoppingToken);
                logger.LogInformation("Queued {Count} weekly summaries", queued);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "The weekly summary run failed");
            }
        }
    }
}
