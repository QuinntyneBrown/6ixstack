using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Infrastructure;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Cli.Tests;

/// <summary>The CLI composed as <c>Program.cs</c> composes it, on a fresh EF Core InMemory database.</summary>
public sealed class CliHarness : IDisposable
{
    public const string Moderator = "jordan@6ixstack.dev";
    public const string Organizer = "priya@gtaazure.ca";

    private readonly ServiceProvider services;

    public CliHarness(IDictionary<string, string?>? settings = null, Action<DbContextOptionsBuilder>? database = null)
    {
        var values = new Dictionary<string, string?> { ["Clock:FixedUtcNow"] = "2026-11-02T14:00:00Z" };
        foreach (var (key, value) in settings ?? new Dictionary<string, string?>())
        {
            values[key] = value;
        }

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        var databaseName = Guid.NewGuid().ToString();
        services = new ServiceCollection()
            .AddLogging()
            .AddSingleton<IConfiguration>(configuration)
            .AddDbContext<AppDbContext>(database ?? (o => o.UseInMemoryDatabase(databaseName)))
            .AddInfrastructureServices(configuration)
            .AddEventAdministration()
            .BuildServiceProvider();
    }

    public static async Task<CliHarness> SeededAsync(IDictionary<string, string?>? settings = null)
    {
        var harness = new CliHarness(settings);
        Assert.Equal(0, (await harness.RunAsync("seed")).ExitCode);
        return harness;
    }

    public Task<CliResult> RunAsync(params string[] args) => RunWithInputAsync(null, args);

    /// <summary>Runs as if from a terminal when <paramref name="input"/> is set, otherwise with redirected input.</summary>
    public async Task<CliResult> RunWithInputAsync(string? input, params string[] args)
    {
        var output = new StringWriter();
        var exit = await CliApp.RunAsync(args, services, output, input is null ? null : new StringReader(input));
        return new CliResult(exit, output.ToString());
    }

    public async Task<T> QueryAsync<T>(Func<AppDbContext, Task<T>> query)
    {
        using var scope = services.CreateScope();
        return await query(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    /// <summary>Sends a request as the API would, to see what the public site shows.</summary>
    public async Task<T> SendAsync<T>(IRequest<T> request)
    {
        using var scope = services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<ISender>().Send(request);
    }

    public void Dispose() => services.Dispose();
}

public sealed record CliResult(int ExitCode, string Output)
{
    public JsonElement Json => JsonDocument.Parse(Output).RootElement;
}
