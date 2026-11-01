using System.Globalization;
using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Time;
using SixStack.Application.EventAdmin;

namespace SixStack.Cli;

/// <summary>
/// The <c>events</c> command group (event-admin-cli design): parses, sends one MediatR request per step, prints a
/// table or one JSON document, and maps exceptions to exit codes. Business rules live in the handlers.
/// </summary>
public sealed class EventsCommand(IServiceProvider services, TextWriter output)
{
    private const string Json = "--json";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public async Task<int> RunAsync(string[] args, CancellationToken cancellationToken)
    {
        var json = args.Contains(Json);
        try
        {
            using var scope = services.CreateScope();
            var sender = scope.ServiceProvider.GetRequiredService<ISender>();
            return args.FirstOrDefault() switch
            {
                "list" => await ListAsync(sender, args[1..], cancellationToken),
                "get" => await GetAsync(sender, args[1..], cancellationToken),
                null => throw new CliUsageException("Name an events command. " + CliApp.Usage),
                var other => throw new CliUsageException($"Unknown events command '{other}'. " + CliApp.Usage),
            };
        }
        catch (CliUsageException ex)
        {
            return await FailAsync(json, ExitCodes.Usage, "usage", ex.Message);
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
            return await FailAsync(json, ExitCodes.Validation, "validation", "The event is not valid.", fields);
        }
    }

    private async Task<int> ListAsync(ISender sender, string[] args, CancellationToken cancellationToken)
    {
        var a = CliArguments.Parse(args, ["--status", "--from", "--to", "--search", "--take"], [Json]);
        NoPositionals(a, "events list");
        var status = a.Get("--status") is { } name
            ? AdminEventStatus.ByName.TryGetValue(name, out var s) ? s : throw new CliUsageException($"--status must be one of {string.Join(", ", AdminEventStatus.ByName.Keys)}.")
            : (Domain.Enums.EventStatus?)null;
        var take = ListAdminEventsQuery.DefaultTake;
        if (a.Get("--take") is { } t && (!int.TryParse(t, NumberStyles.None, CultureInfo.InvariantCulture, out take) || take < 1 || take > ListAdminEventsQuery.MaxTake))
        {
            throw new CliUsageException($"--take must be a whole number from 1 to {ListAdminEventsQuery.MaxTake}.");
        }

        var list = await sender.Send(new ListAdminEventsQuery(status, Date(a, "--from"), Date(a, "--to"), a.Get("--search"), take), cancellationToken);
        if (a.Has(Json))
        {
            await WriteJsonAsync(list);
            return ExitCodes.Success;
        }

        await WriteTableAsync(
            ["ID", "SLUG", "STATUS", "STARTS", "TITLE"],
            list.Events.Select(e => new[]
            {
                e.Id.ToString(),
                e.Slug,
                e.Cancelled ? $"{e.Status} (cancelled)" : e.Status,
                TorontoTime.ToLocal(e.StartsAtUtc).ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                e.Title,
            }));
        await output.WriteLineAsync($"{list.Count} event(s).");
        return ExitCodes.Success;
    }

    private async Task<int> GetAsync(ISender sender, string[] args, CancellationToken cancellationToken)
    {
        var a = CliArguments.Parse(args, [], [Json, "--show-contact"]);
        var idOrSlug = OnePositional(a, "events get <id-or-slug>");
        var e = await sender.Send(new GetAdminEventQuery(idOrSlug, a.Has("--show-contact")), cancellationToken);
        if (a.Has(Json))
        {
            await WriteJsonAsync(new { @event = e });
        }
        else
        {
            await WriteFieldsAsync(e);
        }

        return ExitCodes.Success;
    }

    private static DateOnly? Date(CliArguments a, string option) =>
        a.Get(option) is not { } value ? null
        : DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) ? date
        : throw new CliUsageException($"{option} must be a date like 2026-11-03.");

    private static void NoPositionals(CliArguments a, string usage)
    {
        if (a.Positionals.Count > 0)
        {
            throw new CliUsageException($"Unexpected argument '{a.Positionals[0]}'. Usage: sixstack {usage}");
        }
    }

    private static string OnePositional(CliArguments a, string usage) =>
        a.Positionals.Count == 1 ? a.Positionals[0] : throw new CliUsageException($"Usage: sixstack {usage}");

    private Task WriteJsonAsync(object value) => output.WriteLineAsync(JsonSerializer.Serialize(value, JsonOptions));

    /// <summary>One <c>name: value</c> line per property, in the JSON names, so the table and JSON agree.</summary>
    private async Task WriteFieldsAsync(object value)
    {
        foreach (var p in JsonSerializer.SerializeToElement(value, JsonOptions).EnumerateObject())
        {
            var text = p.Value.ValueKind switch
            {
                JsonValueKind.Array => string.Join(", ", p.Value.EnumerateArray().Select(v => v.ToString())),
                JsonValueKind.Null => string.Empty,
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                _ => p.Value.ToString(),
            };
            await output.WriteLineAsync($"{p.Name}: {text}");
        }
    }

    private async Task WriteTableAsync(string[] headers, IEnumerable<string[]> rows)
    {
        var all = rows.ToList();
        var widths = headers.Select((h, i) => all.Select(r => r[i].Length).Prepend(h.Length).Max()).ToArray();
        string Line(string[] cells) => string.Join("  ", cells.Select((c, i) => i == cells.Length - 1 ? c : c.PadRight(widths[i]))).TrimEnd();
        await output.WriteLineAsync(Line(headers));
        foreach (var row in all)
        {
            await output.WriteLineAsync(Line(row));
        }
    }

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
