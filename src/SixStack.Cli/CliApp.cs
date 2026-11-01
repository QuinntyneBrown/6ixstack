using Microsoft.Extensions.DependencyInjection;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Cli;

/// <summary>Runs one database command (migrate, seed or reset), an <c>events</c> command or a <c>tokens</c> command.</summary>
public static class CliApp
{
    public const string Usage = """
        Usage: sixstack <migrate|seed|reset>
               sixstack events <list|get|add|update|delete> [options]   (sixstack events --help)
               sixstack tokens <create|list|revoke> [options]           (sixstack tokens --help)
        """;

    /// <param name="input">The terminal to ask for confirmation, or null when input is redirected.</param>
    public static async Task<int> RunAsync(string[] args, IServiceProvider services, TextWriter output, TextReader? input = null, CancellationToken cancellationToken = default)
    {
        if (args.Length > 0 && args[0] == "events")
        {
            return await new EventsCommand(services, output, input).RunAsync(args[1..], cancellationToken);
        }

        if (args.Length > 0 && args[0] == "tokens")
        {
            return await new TokensCommand(services, output, input).RunAsync(args[1..], cancellationToken);
        }

        if (args.Length != 1)
        {
            await output.WriteLineAsync(Usage);
            return 1;
        }

        using var scope = services.CreateScope();
        var maintenance = scope.ServiceProvider.GetRequiredService<DatabaseMaintenance>();
        switch (args[0].ToLowerInvariant())
        {
            case "migrate":
                await maintenance.MigrateAsync(cancellationToken);
                await output.WriteLineAsync("Database migrated.");
                return 0;
            case "seed":
                await maintenance.SeedAsync(cancellationToken);
                await output.WriteLineAsync("Database seeded.");
                return 0;
            case "reset":
                await maintenance.ResetAsync(cancellationToken);
                await output.WriteLineAsync("Database reset, migrated and seeded.");
                return 0;
            default:
                await output.WriteLineAsync($"Unknown command '{args[0]}'. {Usage}");
                return 1;
        }
    }
}
