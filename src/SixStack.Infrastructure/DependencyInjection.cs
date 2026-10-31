using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Infrastructure.Email;
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
        services.AddSingleton<IClock>(new SystemClock(string.IsNullOrWhiteSpace(fixedNow) ? null : DateTimeOffset.Parse(fixedNow, System.Globalization.CultureInfo.InvariantCulture)));
        services.AddSingleton<DevMailbox>();
        services.AddSingleton<IEmailSender, DevMailboxEmailSender>();
        services.Configure<OutboxOptions>(configuration.GetSection(OutboxOptions.Section));
        services.AddScoped<IOutbox, Outbox.Outbox>();
        services.AddScoped<OutboxDispatcher>();
        services.AddScoped<IOutboxMessageHandler<SendEmail>, SendEmailHandler>();
        services.AddScoped<DatabaseSeeder>();
        services.AddScoped<DatabaseMaintenance>();
        return services;
    }
}
