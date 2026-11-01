using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Infrastructure;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Cli.Tests;

public sealed class CliAppTests : IDisposable
{
    private readonly ServiceProvider services;

    public CliAppTests()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Clock:FixedUtcNow"] = "2026-11-02T14:00:00Z",
        }).Build();
        var databaseName = Guid.NewGuid().ToString();
        services = new ServiceCollection()
            .AddLogging()
            .AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(databaseName))
            .AddInfrastructureServices(configuration)
            .BuildServiceProvider();
    }

    [Fact]
    public async Task Seed_fills_the_database_and_is_safe_to_rerun()
    {
        var output = new StringWriter();

        Assert.Equal(0, await CliApp.RunAsync(["seed"], services, output));
        var first = await EventCount();
        Assert.Equal(0, await CliApp.RunAsync(["seed"], services, output));

        Assert.True(first > 0);
        Assert.Equal(first, await EventCount());
        Assert.Equal(string.Concat(Enumerable.Repeat("Database seeded." + Environment.NewLine, 2)), output.ToString());
    }

    [Fact]
    public async Task Reset_recreates_and_seeds_the_database()
    {
        var output = new StringWriter();

        Assert.Equal(0, await CliApp.RunAsync(["reset"], services, output));

        Assert.True(await EventCount() > 0);
        Assert.Equal("Database reset, migrated and seeded." + Environment.NewLine, output.ToString());
    }

    [Theory]
    [InlineData]
    [InlineData("drop-everything")]
    public async Task Unknown_or_missing_command_prints_usage_and_fails(params string[] args)
    {
        var output = new StringWriter();

        Assert.Equal(1, await CliApp.RunAsync(args, services, output));
        Assert.Contains(CliApp.Usage, output.ToString());
    }

    private async Task<int> EventCount()
    {
        using var scope = services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<AppDbContext>().Events.CountAsync();
    }

    public void Dispose() => services.Dispose();
}
