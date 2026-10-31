using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Infrastructure.Tests;

/// <summary>Per-fixture in-memory SQLite database with the infrastructure services and a fixed clock.</summary>
public sealed class SqliteDatabase : IDisposable
{
    public static readonly DateTimeOffset Today = new(2026, 11, 2, 14, 0, 0, TimeSpan.Zero);

    private readonly SqliteConnection connection = new("Data Source=:memory:");

    public SqliteDatabase(Action<IServiceCollection>? configure = null)
    {
        connection.Open();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Clock:FixedUtcNow"] = Today.ToString("O") })
            .Build();
        var services = new ServiceCollection();
        services.AddLogging(b => b.SetMinimumLevel(LogLevel.Warning));
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));
        services.AddInfrastructureServices(configuration);
        configure?.Invoke(services);
        Services = services.BuildServiceProvider();
        using var scope = Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
    }

    public ServiceProvider Services { get; }

    public async Task<T> RunAsync<T>(Func<IServiceProvider, Task<T>> action)
    {
        using var scope = Services.CreateScope();
        return await action(scope.ServiceProvider);
    }

    public void Dispose()
    {
        Services.Dispose();
        connection.Dispose();
    }
}
