using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Application.Events;
using SixStack.Infrastructure.Calendar;
using SixStack.Infrastructure.Email;
using SixStack.Infrastructure.Identity;
using SixStack.Infrastructure.Checks;
using SixStack.Application.Moderation;
using SixStack.Infrastructure.Outbox;
using SixStack.Infrastructure.Persistence;
using SixStack.Infrastructure.Seeding;
using SixStack.Infrastructure.Services;

namespace SixStack.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers persistence and infrastructure services. <c>Database:Provider</c> selects
    /// <c>SqlServer</c> (default) or <c>Sqlite</c> (Playwright and local demos);
    /// <c>ConnectionStrings:Default</c> is the connection string.
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        var provider = configuration["Database:Provider"] ?? "SqlServer";
        services.AddDbContext<AppDbContext>(options =>
        {
            if (string.Equals(provider, "Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                options.UseSqlite(connectionString ?? "Data Source=sixstack.db");
            }
            else
            {
                options.UseSqlServer(connectionString);
            }
        });

        return services.AddInfrastructureServices(configuration);
    }

    /// <summary>Everything except the DbContext registration, for hosts and tests that register their own.</summary>
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        var fixedNow = configuration["Clock:FixedUtcNow"];
        services.AddSingleton<IClock>(new SystemClock(
            string.IsNullOrWhiteSpace(fixedNow) ? null : DateTimeOffset.Parse(fixedNow, System.Globalization.CultureInfo.InvariantCulture),
            string.Equals(configuration["Clock:Ticking"], "true", StringComparison.OrdinalIgnoreCase)));
        services.AddSingleton<DevMailbox>();
        services.AddSingleton<IEmailSender, DevMailboxEmailSender>();
        services.Configure<OutboxOptions>(configuration.GetSection(OutboxOptions.Section));
        services.AddScoped<IOutbox, Outbox.Outbox>();
        services.AddScoped<Application.Organizer.IAttendeeDirectory, Organizer.NoAttendeeDirectory>();
        services.AddScoped<OutboxDispatcher>();
        services.AddHostedService<Notifications.WeeklySummaryJob>();
        services.AddScoped<IOutboxMessageHandler<SendEmail>, SendEmailHandler>();
        services.Configure<SiteOptions>(configuration.GetSection(SiteOptions.Section));
        services.AddSingleton<IIcsWriter, IcsWriter>();
        services.AddScoped<ISecurityTokenService, SecurityTokenService>();
        services.AddSingleton<IApiTokenHasher, ApiTokenHasher>();
        services.Configure<SubmissionChecksOptions>(configuration.GetSection(SubmissionChecksOptions.Section));
        services.AddSingleton<IGeocoder, LocalGeocoder>();
        services.Configure<GeocodingOptions>(configuration.GetSection(GeocodingOptions.Section));
        services.AddSingleton<IVenueLocator, LocalVenueLocator>();
        services.AddHostedService<VenueGeocodingJob>();
        if (configuration.GetValue<string>($"{SubmissionChecksOptions.Section}:LinkChecker") == "AssumeReachable")
        {
            services.AddSingleton<ILinkChecker, AssumeReachableLinkChecker>();
        }
        else
        {
            services.AddHttpClient<ILinkChecker, HttpLinkChecker>(client => client.Timeout = HttpLinkChecker.Timeout)
                .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });
        }

        services.AddScoped<DatabaseSeeder>();
        services.AddScoped<DatabaseMaintenance>();
        return services;
    }
}
