using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Infrastructure.Tests;

public sealed class SqlServerMigrationTests
{
    [SqlServerFact]
    [Trait("Category", "SqlServer")]
    public async Task Migrate_then_seed_works_on_sql_server()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = SqlServerFactAttribute.ConnectionString,
        }).Build();
        var services = new ServiceCollection().AddLogging().AddInfrastructure(configuration).BuildServiceProvider();
        using var scope = services.CreateScope();
        var maintenance = scope.ServiceProvider.GetRequiredService<DatabaseMaintenance>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            await maintenance.MigrateAsync();
            await maintenance.SeedAsync();

            Assert.Empty(await db.Database.GetPendingMigrationsAsync());
            Assert.True(await db.Events.AnyAsync());
        }
        finally
        {
            await db.Database.EnsureDeletedAsync();
        }
    }
}
