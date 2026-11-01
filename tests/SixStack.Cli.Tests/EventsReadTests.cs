using System.Text.Json;

namespace SixStack.Cli.Tests;

/// <summary>Acceptance tests for <c>events list</c> and <c>events get</c> (L2-105, L2-106, L2-110).</summary>
public sealed class EventsReadTests : IAsyncLifetime
{
    private CliHarness cli = null!;

    public async Task InitializeAsync() => cli = await CliHarness.SeededAsync();

    public Task DisposeAsync()
    {
        cli.Dispose();
        return Task.CompletedTask;
    }

    // L2-105 #1: Given the seeded database, when list runs with a status and Toronto date range,
    // then a table lists only the matching events, earliest first.
    [Fact]
    public async Task List_shows_a_table_of_matching_events_in_start_order()
    {
        var result = await cli.RunAsync("events", "list", "--status", "published", "--from", "2026-11-03", "--to", "2026-11-04");

        Assert.Equal(0, result.ExitCode);
        foreach (var column in new[] { "ID", "SLUG", "STATUS", "STARTS", "TITLE" })
        {
            Assert.Contains(column, result.Output);
        }

        var dotnet = result.Output.IndexOf("whats-new-in-dotnet-11-previews", StringComparison.Ordinal);
        var foundry = result.Output.IndexOf("azure-ai-foundry-shipping-agents", StringComparison.Ordinal);
        Assert.True(dotnet >= 0 && foundry > dotnet, result.Output);
        Assert.Contains("signals-all-the-way-down", result.Output);
        Assert.Contains("2026-11-03 18:00", result.Output);
        Assert.DoesNotContain("azure-data-ai-day-gta", result.Output);
        Assert.DoesNotContain("minimal-apis-in-practice-october", result.Output);
    }

    // L2-105 #1 and L2-110 #1: the same list as JSON has the documented shape.
    [Fact]
    public async Task List_as_json_has_a_stable_shape()
    {
        var result = await cli.RunAsync("events", "list", "--status", "published", "--from", "2026-11-03", "--to", "2026-11-03", "--json");

        Assert.Equal(0, result.ExitCode);
        Assert.Equal(1, result.Json.GetProperty("count").GetInt32());
        var e = Assert.Single(result.Json.GetProperty("events").EnumerateArray());
        Assert.Equal("whats-new-in-dotnet-11-previews", e.GetProperty("slug").GetString());
        Assert.Equal("What's new in the .NET 11 previews", e.GetProperty("title").GetString());
        Assert.Equal("published", e.GetProperty("status").GetString());
        Assert.False(e.GetProperty("cancelled").GetBoolean());
        Assert.Equal("inPerson", e.GetProperty("format").GetString());
        Assert.Equal("Toronto .NET User Group", e.GetProperty("organizerName").GetString());
        Assert.Equal(DateTimeOffset.Parse("2026-11-03T23:00:00Z"), e.GetProperty("startsAtUtc").GetDateTimeOffset());
        Assert.Equal(DateTimeOffset.Parse("2026-11-04T01:30:00Z"), e.GetProperty("endsAtUtc").GetDateTimeOffset());
        Assert.True(Guid.TryParse(e.GetProperty("id").GetString(), out _));
    }

    // L2-105 #2: Given --search, then only events whose title or organizer contains the text in any case are listed.
    [Fact]
    public async Task List_searches_title_and_organizer_case_insensitively()
    {
        var result = await cli.RunAsync("events", "list", "--search", "AZURE", "--take", "500", "--json");

        Assert.Equal(0, result.ExitCode);
        var events = result.Json.GetProperty("events").EnumerateArray().ToList();
        Assert.NotEmpty(events);
        Assert.All(events, e => Assert.True(
            e.GetProperty("title").GetString()!.Contains("azure", StringComparison.OrdinalIgnoreCase)
            || (e.GetProperty("organizerName").GetString() ?? string.Empty).Contains("azure", StringComparison.OrdinalIgnoreCase)));
        Assert.Contains(events, e => e.GetProperty("slug").GetString() == "azure-data-ai-day-gta");
    }

    // L2-105 #3: Given --take 2, then at most 2 events are listed.
    [Fact]
    public async Task List_takes_at_most_the_requested_number()
    {
        var result = await cli.RunAsync("events", "list", "--take", "2", "--json");

        Assert.Equal(0, result.ExitCode);
        Assert.Equal(2, result.Json.GetProperty("events").GetArrayLength());
    }

    // L2-105 #4: Given a bad option value or an unknown option, then exit code 1 names the option.
    [Theory]
    [InlineData("--status", "maybe")]
    [InlineData("--from", "11/03/2026")]
    [InlineData("--to", "tomorrow")]
    [InlineData("--take", "0")]
    [InlineData("--take", "501")]
    [InlineData("--colour", "red")]
    public async Task List_rejects_bad_options_as_usage_errors(string option, string value)
    {
        var result = await cli.RunAsync("events", "list", option, value);

        Assert.Equal(1, result.ExitCode);
        Assert.Contains(option, result.Output);
    }

    // L2-110 #4: a usage error with --json is one error document.
    [Fact]
    public async Task Usage_error_as_json_is_an_error_document()
    {
        var result = await cli.RunAsync("events", "list", "--status", "maybe", "--json");

        Assert.Equal(1, result.ExitCode);
        Assert.Equal("usage", result.Json.GetProperty("error").GetProperty("code").GetString());
        Assert.Contains("--status", result.Json.GetProperty("error").GetProperty("message").GetString());
    }

    // L2-106 #1: Given a seeded slug, when get runs, then its details and version are shown.
    [Fact]
    public async Task Get_by_slug_shows_the_event_details()
    {
        var result = await cli.RunAsync("events", "get", "whats-new-in-dotnet-11-previews");

        Assert.Equal(0, result.ExitCode);
        Assert.Contains("title: What's new in the .NET 11 previews", result.Output);
        Assert.Contains("status: published", result.Output);
        Assert.Contains("organizerName: Toronto .NET User Group", result.Output);
        Assert.Contains("date: 2026-11-03", result.Output);
        Assert.Contains("startTime: 18:00", result.Output);
        Assert.Contains("endTime: 20:30", result.Output);
        Assert.Contains("timeZoneId: America/Toronto", result.Output);
        Assert.Contains("format: inPerson", result.Output);
        Assert.Contains("isFree: true", result.Output);
        Assert.Contains("version: ", result.Output);
    }

    // L2-106 #2 and L2-110 #2: Given the id, the same event is shown; JSON holds the form fields.
    [Fact]
    public async Task Get_by_id_shows_the_same_event_as_json()
    {
        var bySlug = (await cli.RunAsync("events", "get", "azure-data-ai-day-gta", "--json")).Json.GetProperty("event");
        var id = bySlug.GetProperty("id").GetString()!;

        var result = await cli.RunAsync("events", "get", id, "--json");

        Assert.Equal(0, result.ExitCode);
        var e = result.Json.GetProperty("event");
        Assert.Equal("azure-data-ai-day-gta", e.GetProperty("slug").GetString());
        Assert.Equal("hybrid", e.GetProperty("format").GetString());
        Assert.Equal(49m, e.GetProperty("priceCad").GetDecimal());
        Assert.False(e.GetProperty("isFree").GetBoolean());
        Assert.Equal(["azure", "ai"], e.GetProperty("topics").EnumerateArray().Select(t => t.GetString()).Order().Reverse());
        foreach (var name in new[] { "title", "organizerName", "description", "date", "timeZoneId", "startTime", "endTime", "venueName", "city", "streetAddress", "streamUrl", "ticketUrl", "status", "cancelled", "cancellationReason", "startsAtUtc", "endsAtUtc", "version" })
        {
            Assert.True(e.TryGetProperty(name, out _), name);
        }
    }

    // L2-106 #3: Given an id or slug that matches nothing, then exit code 3.
    [Theory]
    [InlineData("no-such-event")]
    [InlineData("6f9619ff-8b86-d011-b42d-00c04fc964ff")]
    public async Task Get_unknown_event_is_not_found(string idOrSlug)
    {
        var result = await cli.RunAsync("events", "get", idOrSlug);

        Assert.Equal(3, result.ExitCode);
        Assert.Contains($"No event matches '{idOrSlug}'.", result.Output);
    }

    // L2-110 #4: not found as JSON.
    [Fact]
    public async Task Get_unknown_event_as_json_is_a_not_found_error()
    {
        var result = await cli.RunAsync("events", "get", "no-such-event", "--json");

        Assert.Equal(3, result.ExitCode);
        Assert.Equal("notFound", result.Json.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(JsonValueKind.Object, result.Json.GetProperty("error").GetProperty("fields").ValueKind);
    }
}
