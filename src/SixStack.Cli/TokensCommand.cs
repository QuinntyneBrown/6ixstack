using System.Globalization;
using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Application.ApiTokens;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.EventAdmin;

namespace SixStack.Cli;

/// <summary>
/// The <c>tokens</c> command group (event-admin-api design, L2-124): the actor's own API tokens, with the write guard,
/// output and exit codes of <see cref="EventsCommand"/>. Business rules live in the handlers.
/// </summary>
public sealed class TokensCommand(IServiceProvider services, TextWriter output, TextReader? input)
{
    private const string Json = "--json";
    private const string Yes = "--yes";
    private const string DryRun = "--dry-run";
    private const string Actor = "--actor";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public async Task<int> RunAsync(string[] args, CancellationToken cancellationToken)
    {
        var json = args.Contains(Json);
        if (args.Contains("--help"))
        {
            await output.WriteLineAsync(args[0] != "--help" && TokensHelp.Commands.TryGetValue(args[0], out var help) ? help : TokensHelp.Overview);
            return ExitCodes.Success;
        }

        try
        {
            using var scope = services.CreateScope();
            return args.FirstOrDefault() switch
            {
                "create" => await CreateAsync(scope.ServiceProvider, args[1..], cancellationToken),
                null => throw new CliUsageException("Name a tokens command.\n" + CliApp.Usage),
                var other => throw new CliUsageException($"Unknown tokens command '{other}'.\n" + CliApp.Usage),
            };
        }
        catch (CliUsageException ex)
        {
            return await FailAsync(json, ExitCodes.Usage, "usage", ex.Message);
        }
        catch (ForbiddenAccessException ex)
        {
            return await FailAsync(json, ExitCodes.Actor, "actor", ex.Message);
        }
        catch (EditConflictException ex)
        {
            return await FailAsync(json, ExitCodes.Conflict, "conflict", ex.Message);
        }
        catch (NotFoundException ex)
        {
            return await FailAsync(json, ExitCodes.NotFound, "notFound", ex.Message);
        }
        catch (ValidationException ex)
        {
            var fields = ex.Errors
                .GroupBy(f => JsonNamingPolicy.CamelCase.ConvertName(f.PropertyName))
                .ToDictionary(g => g.Key, g => g.Select(f => f.ErrorMessage).Distinct().ToArray());
            return await FailAsync(json, ExitCodes.Validation, "validation", "The token is not valid.", fields);
        }
        catch (Exception ex)
        {
            // A driver's message can name the server, the database or the login, so only the type is printed (L2-113).
            return await FailAsync(json, ExitCodes.Unexpected, "unexpected", $"Unexpected error ({ex.GetType().Name}). Details are not printed, to keep secrets out of the output.");
        }
    }

    private async Task<int> CreateAsync(IServiceProvider scope, string[] args, CancellationToken cancellationToken)
    {
        var a = CliArguments.Parse(args, ["--name", "--days", Actor], [Json, Yes, DryRun]);
        NoPositionals(a, "tokens create --name <name>");
        var days = Domain.Entities.ApiToken.DefaultDays;
        if (a.Get("--days") is { } d && !int.TryParse(d, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out days))
        {
            throw new CliUsageException("--days must be a whole number of days, such as 90.");
        }

        return await WriteAsync(scope, a, apply => new CreateApiTokenCommand(a.Get("--name"), days, apply), cancellationToken);
    }

    /// <summary>Resolves the moderator actor and signs it in, so every command acts on the actor's own tokens (L2-124).</summary>
    private static async Task SignInActorAsync(IServiceProvider scope, CliArguments a, CancellationToken cancellationToken)
    {
        var actor = a.Get(Actor) ?? scope.GetService<IConfiguration>()?["SIXSTACK_ACTOR"];
        if (string.IsNullOrWhiteSpace(actor))
        {
            throw new ForbiddenAccessException("Name whose tokens these are with --actor <email> or SIXSTACK_ACTOR.");
        }

        var id = await scope.GetRequiredService<ISender>().Send(new GetModeratorActorQuery(actor), cancellationToken);
        scope.GetRequiredService<CliCurrentUser>().SignIn(id);
    }

    /// <summary>The write guard of L2-111: preview, then stop for a dry run, apply with --yes or an interactive "y".</summary>
    private async Task<int> WriteAsync(IServiceProvider scope, CliArguments a, Func<bool, IRequest<ApiTokenWriteResultDto>> request, CancellationToken cancellationToken)
    {
        if (a.Has(Yes) && a.Has(DryRun))
        {
            throw new CliUsageException("Use --yes or --dry-run, not both.");
        }

        await SignInActorAsync(scope, a, cancellationToken);
        var sender = scope.GetRequiredService<ISender>();
        var preview = await sender.Send(request(false), cancellationToken);
        var json = a.Has(Json);
        if (a.Has(DryRun))
        {
            await ReportAsync(json, preview);
            return ExitCodes.Success;
        }

        if (!a.Has(Yes))
        {
            if (!json)
            {
                await ReportAsync(false, preview);
            }

            if (json || input is null)
            {
                return await FailAsync(json, ExitCodes.NotConfirmed, "notConfirmed", "Nothing changed. Re-run with --yes to apply.");
            }

            await output.WriteAsync("Apply? [y/N] ");
            var answer = (await input.ReadLineAsync(cancellationToken))?.Trim();
            if (!string.Equals(answer, "y", StringComparison.OrdinalIgnoreCase) && !string.Equals(answer, "yes", StringComparison.OrdinalIgnoreCase))
            {
                await output.WriteLineAsync();
                return await FailAsync(false, ExitCodes.NotConfirmed, "notConfirmed", "Nothing changed.");
            }
        }

        await ReportAsync(json, await sender.Send(request(true), cancellationToken));
        return ExitCodes.Success;
    }

    private async Task ReportAsync(bool json, ApiTokenWriteResultDto result)
    {
        if (json)
        {
            await WriteJsonAsync(new { result });
            return;
        }

        var t = result.ApiToken;
        var verb = result.Action == "created" ? "create" : "revoke";
        await output.WriteLineAsync(result.DryRun
            ? $"Will {verb} token {t.Name}{(result.Action == "created" ? string.Empty : $" ({t.Id})")}"
            : $"{char.ToUpperInvariant(result.Action[0])}{result.Action[1..]} token {t.Name} ({t.Id})");
        await output.WriteLineAsync($"  expires: {Utc(t.ExpiresAtUtc)}");
        await output.WriteLineAsync($"  status: {t.Status}");
        if (result.Token is { } token)
        {
            await output.WriteLineAsync($"  token: {token}");
            await output.WriteLineAsync("Store this token now; it can't be shown again.");
        }
    }

    private static string Utc(DateTimeOffset? value) =>
        value?.UtcDateTime.ToString("yyyy-MM-dd HH:mm 'UTC'", CultureInfo.InvariantCulture) ?? "-";

    private static void NoPositionals(CliArguments a, string usage)
    {
        if (a.Positionals.Count > 0)
        {
            throw new CliUsageException($"Unexpected argument '{a.Positionals[0]}'. Usage: sixstack {usage}");
        }
    }

    private Task WriteJsonAsync(object value) => output.WriteLineAsync(JsonSerializer.Serialize(value, JsonOptions));

    private async Task<int> FailAsync(bool json, int exitCode, string code, string message, IReadOnlyDictionary<string, string[]>? fields = null)
    {
        fields ??= new Dictionary<string, string[]>();
        if (json)
        {
            await WriteJsonAsync(new { error = new { code, message, fields } });
        }
        else
        {
            await output.WriteLineAsync(message);
            foreach (var (field, messages) in fields)
            {
                foreach (var m in messages)
                {
                    await output.WriteLineAsync($"  {field}: {m}");
                }
            }
        }

        return exitCode;
    }
}
