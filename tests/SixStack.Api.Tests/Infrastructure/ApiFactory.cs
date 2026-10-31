using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Infrastructure.Persistence;
using SixStack.Infrastructure.Seeding;

namespace SixStack.Api.Tests.Infrastructure;

/// <summary>
/// The API on a per-fixture in-memory SQLite database, seeded with the mock cast, with the clock fixed at
/// Monday, November 2, 2026, 9:00 AM ET and the test sign-in seam enabled.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public static readonly DateTimeOffset Today = new(2026, 11, 2, 14, 0, 0, TimeSpan.Zero);

    private readonly string databaseName = $"sixstack-{Guid.NewGuid():N}";
    private SqliteConnection? keepAlive;

    public string ConnectionString => $"Data Source={databaseName};Mode=Memory;Cache=Shared";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Database:Provider", "Sqlite");
        builder.UseSetting("ConnectionStrings:Default", ConnectionString);
        builder.UseSetting("Clock:FixedUtcNow", Today.ToString("O"));
        builder.UseSetting("Auth:TestSignIn:Enabled", "true");
        builder.UseSetting("Outbox:Enabled", "false");
        builder.UseSetting("Swagger:Enabled", "true");
        builder.UseSetting("DevMailbox:Expose", "true");
        builder.ConfigureServices(ConfigureTestServices);
    }

    /// <summary>Hook for fixtures that add test-only services or controllers.</summary>
    protected virtual void ConfigureTestServices(IServiceCollection services)
    {
    }

    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);
        EnsureDatabase();
    }

    /// <summary>A client on https, so Secure cookies round-trip.</summary>
    public HttpClient CreateHttpsClient() =>
        CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });

    public async Task<T> WithDbAsync<T>(Func<AppDbContext, Task<T>> action)
    {
        EnsureDatabase();
        using var scope = Services.CreateScope();
        return await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    private void EnsureDatabase()
    {
        if (keepAlive is not null)
        {
            return;
        }

        keepAlive = new SqliteConnection(ConnectionString);
        keepAlive.Open();
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedAsync().GetAwaiter().GetResult();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            keepAlive?.Dispose();
        }
    }
}
