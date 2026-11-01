using System.Globalization;
using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Time;
using SixStack.Application.EventAdmin;
using SixStack.Domain.Exceptions;

namespace SixStack.Cli;

/// <summary>
/// The <c>events</c> command group (event-admin-cli design): parses, sends one MediatR request per step, prints a
/// table or one JSON document, and maps exceptions to exit codes. Business rules live in the handlers.
/// </summary>
public sealed class EventsCommand(IServiceProvider services, TextWriter output, TextReader? input)
{
    private const string Json = "--json";
    private const string Yes = "--yes";
    private const string DryRun = "--dry-run";
    private const string Actor = "--actor";
    private const string File = "--file";
    private const string IfVersion = "--if-version";

    /// <summary>Field flags and the event file property each one sets.</summary>
    private static readonly string[] FieldOptions =
    [
        "--title", "--organizer", "--description", "--topics", "--date", "--start", "--end", "--time-zone", "--format",
        "--venue", "--city", "--address", "--stream-url", "--ticket-url", "--price",
    ];

    private static readonly JsonSerializerOptions FileOptions = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow,
        NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.Strict,
    };

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
                "add" => await AddAsync(scope.ServiceProvider, args[1..], cancellationToken),
                "update" => await UpdateAsync(scope.ServiceProvider, args[1..], cancellationToken),
                "delete" => await DeleteAsync(scope.ServiceProvider, args[1..], cancellationToken),
                null => throw new CliUsageException("Name an events command. " + CliApp.Usage),
                var other => throw new CliUsageException($"Unknown events command '{other}'. " + CliApp.Usage),
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
        catch (InvalidStatusTransitionException ex)
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

    private async Task<int> AddAsync(IServiceProvider scope, string[] args, CancellationToken cancellationToken)
    {
        var a = CliArguments.Parse(args, [File, Actor, .. FieldOptions], [Json, Yes, DryRun]);
        NoPositionals(a, "events add [--file <event.json>] [field flags]");
        var patch = await PatchAsync(a, cancellationToken);
        return await WriteAsync(scope, a, (apply, _) => AddAdminEventCommand.From(patch, apply), cancellationToken);
    }

    private async Task<int> UpdateAsync(IServiceProvider scope, string[] args, CancellationToken cancellationToken)
    {
        var a = CliArguments.Parse(args, [File, Actor, IfVersion, .. FieldOptions], [Json, Yes, DryRun]);
        var idOrSlug = OnePositional(a, "events update <id-or-slug> [--file <patch.json>] [field flags]");
        var patch = await PatchAsync(a, cancellationToken);
        var expected = Version(a);
        return await WriteAsync(scope, a, (apply, previewed) => new UpdateAdminEventCommand(idOrSlug, patch, previewed ?? expected, apply), cancellationToken);
    }

    private async Task<int> DeleteAsync(IServiceProvider scope, string[] args, CancellationToken cancellationToken)
    {
        var a = CliArguments.Parse(args, [Actor, IfVersion], [Json, Yes, DryRun]);
        var idOrSlug = OnePositional(a, "events delete <id-or-slug>");
        var expected = Version(a);
        return await WriteAsync(scope, a, (apply, previewed) => new DeleteAdminEventCommand(idOrSlug, previewed ?? expected, apply), cancellationToken);
    }

    /// <summary>
    /// The write guard (L2-111): sign in the actor, preview, then stop for a dry run, apply with --yes or an
    /// interactive "y", and otherwise write nothing.
    /// </summary>
    private async Task<int> WriteAsync(IServiceProvider scope, CliArguments a, Func<bool, Guid?, IRequest<AdminWriteResultDto>> request, CancellationToken cancellationToken)
    {
        if (a.Has(Yes) && a.Has(DryRun))
        {
            throw new CliUsageException("Use --yes or --dry-run, not both.");
        }

        var sender = scope.GetRequiredService<ISender>();
        var actor = a.Get(Actor) ?? scope.GetService<Microsoft.Extensions.Configuration.IConfiguration>()?["SIXSTACK_ACTOR"];
        if (string.IsNullOrWhiteSpace(actor))
        {
            throw new ForbiddenAccessException("Name who is making this change with --actor <email> or SIXSTACK_ACTOR.");
        }

        scope.GetRequiredService<CliCurrentUser>().SignIn(await sender.Send(new GetModeratorActorQuery(actor), cancellationToken));
        var preview = await sender.Send(request(false, null), cancellationToken);
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

        // Apply what was previewed: a change made since then is a conflict, not a silent overwrite.
        await ReportAsync(json, await sender.Send(request(true, preview.Event.Version), cancellationToken));
        return ExitCodes.Success;
    }

    private async Task ReportAsync(bool json, AdminWriteResultDto result)
    {
        if (json)
        {
            await WriteJsonAsync(new { result });
            return;
        }

        var e = result.Event;
        var verb = result.Action switch { "added" => "add", "updated" => "update", _ => "delete" };
        await output.WriteLineAsync(result.DryRun
            ? $"Will {verb} {e.Slug} ({e.Id}): {e.Title}"
            : $"{char.ToUpperInvariant(result.Action[0])}{result.Action[1..]} {e.Slug} ({e.Id}): {e.Title}");
        await output.WriteLineAsync($"  status: {e.Status}{(e.Cancelled ? " (cancelled)" : string.Empty)}");
        await output.WriteLineAsync($"  starts: {TorontoTime.ToLocal(e.StartsAtUtc).ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)} Toronto time");
        await output.WriteLineAsync($"  changes: {(result.Changes.Count == 0 ? "none" : string.Join(", ", result.Changes))}");
    }

    /// <summary>The event file, then the field flags over it (the flags win).</summary>
    private static async Task<EventDetailsPatch> PatchAsync(CliArguments a, CancellationToken cancellationToken)
    {
        var patch = new EventDetailsPatch();
        if (a.Get(File) is { } path)
        {
            string text;
            try
            {
                text = await System.IO.File.ReadAllTextAsync(path, cancellationToken);
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                throw new CliUsageException($"--file: can't read {path}.");
            }

            try
            {
                patch = JsonSerializer.Deserialize<EventDetailsPatch>(text, FileOptions) ?? throw new CliUsageException($"--file: {path} holds no event.");
            }
            catch (JsonException ex)
            {
                throw new CliUsageException($"--file: {path} is not a valid event file. {ex.Message}");
            }
        }

        string? Flag(string option) => a.Get(option);
        decimal? price = null;
        if (a.Get("--price") is { } p)
        {
            price = decimal.TryParse(p, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var value)
                ? value
                : throw new CliUsageException("--price must be an amount in Canadian dollars, such as 25 or 0.");
        }

        return patch with
        {
            Title = Flag("--title") ?? patch.Title,
            OrganizerName = Flag("--organizer") ?? patch.OrganizerName,
            Description = Flag("--description") ?? patch.Description,
            Topics = Flag("--topics") is { } topics
                ? topics.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                : patch.Topics,
            Date = Flag("--date") ?? patch.Date,
            StartTime = Flag("--start") ?? patch.StartTime,
            EndTime = Flag("--end") ?? patch.EndTime,
            TimeZoneId = Flag("--time-zone") ?? patch.TimeZoneId,
            Format = Flag("--format") ?? patch.Format,
            VenueName = Flag("--venue") ?? patch.VenueName,
            City = Flag("--city") ?? patch.City,
            StreetAddress = Flag("--address") ?? patch.StreetAddress,
            StreamUrl = Flag("--stream-url") ?? patch.StreamUrl,
            TicketUrl = Flag("--ticket-url") ?? patch.TicketUrl,
            PriceCad = price ?? patch.PriceCad,
            IsFree = price is { } given ? given == 0 : patch.IsFree,
        };
    }

    private static Guid? Version(CliArguments a) =>
        a.Get(IfVersion) is not { } value ? null
        : Guid.TryParse(value, out var version) ? version
        : throw new CliUsageException($"{IfVersion} must be the version that events get prints.");

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
