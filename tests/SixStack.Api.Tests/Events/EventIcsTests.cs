using System.Globalization;
using System.Net;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-037: GET /api/events/{slug}/ics, a single-event iCalendar file in Toronto time.</summary>
public sealed class EventIcsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<(HttpResponseMessage Response, string Body)> Get(string slug)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/events/{slug}/ics");
        return (response, await response.Content.ReadAsStringAsync());
    }

    /// <summary>The first property line with this name inside the VEVENT (the VTIMEZONE has its own DTSTART).</summary>
    private static string? Line(string body, string name) =>
        Unfold(body)[Unfold(body).IndexOf("BEGIN:VEVENT", StringComparison.Ordinal)..]
            .Split("\r\n")
            .FirstOrDefault(l => l.StartsWith(name, StringComparison.Ordinal));

    private static string Unfold(string body) => body.Replace("\r\n ", string.Empty, StringComparison.Ordinal);

    [Fact]
    public async Task Downloads_as_a_calendar_file_named_after_the_event()
    {
        var (response, _) = await Get("azure-data-ai-day-gta");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/calendar", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("utf-8", response.Content.Headers.ContentType?.CharSet);
        Assert.Equal("attachment", response.Content.Headers.ContentDisposition?.DispositionType);
        Assert.Equal("azure-data-ai-day-gta.ics", response.Content.Headers.ContentDisposition?.FileName?.Trim('"'));
    }

    [Fact]
    public async Task Holds_one_event_in_toronto_time_with_its_timezone_definition()
    {
        var (_, body) = await Get("azure-data-ai-day-gta");

        Assert.StartsWith("BEGIN:VCALENDAR\r\n", body, StringComparison.Ordinal);
        Assert.EndsWith("END:VCALENDAR\r\n", body, StringComparison.Ordinal);
        Assert.Contains("BEGIN:VTIMEZONE\r\nTZID:America/Toronto\r\n", body, StringComparison.Ordinal);
        Assert.Single(body.Split("BEGIN:VEVENT").Skip(1));
        Assert.Equal("DTSTART;TZID=America/Toronto:20261105T090000", Line(body, "DTSTART"));
        Assert.Equal("DTEND;TZID=America/Toronto:20261105T170000", Line(body, "DTEND"));
        Assert.Equal("SUMMARY:Azure Data & AI Day GTA", Line(body, "SUMMARY"));
        Assert.Equal("LOCATION:Living Arts Centre\\, 4141 Living Arts Dr\\, Mississauga", Line(body, "LOCATION"));
        Assert.Equal("URL:https://6ixstack.dev/events/azure-data-ai-day-gta", Line(body, "URL"));
        Assert.Equal("STATUS:CONFIRMED", Line(body, "STATUS"));
        Assert.Matches("^UID:[0-9a-f-]{36}@6ixstack\\.dev$", Line(body, "UID"));
        Assert.Contains("https://6ixstack.dev/events/azure-data-ai-day-gta", Line(body, "DESCRIPTION"));
    }

    [Fact]
    public async Task Converted_from_its_zone_the_start_is_the_events_instant()
    {
        var (_, body) = await Get("azure-data-ai-day-gta");

        var local = DateTime.ParseExact(Line(body, "DTSTART")!.Split(':')[1], "yyyyMMdd'T'HHmmss", CultureInfo.InvariantCulture);
        var zone = TimeZoneInfo.FindSystemTimeZoneById("America/Toronto");
        var utc = TimeZoneInfo.ConvertTimeToUtc(local, zone);

        Assert.Equal(new DateTime(2026, 11, 5, 14, 0, 0, DateTimeKind.Utc), utc);
    }

    [Fact]
    public async Task Text_is_escaped_and_lines_are_folded_at_75_octets()
    {
        var (_, body) = await Get("azure-data-ai-day-gta");

        Assert.All(body.Split("\r\n"), line => Assert.True(System.Text.Encoding.UTF8.GetByteCount(line) <= 75, line));
        var description = Line(body, "DESCRIPTION")!;
        Assert.Contains("\\n", description, StringComparison.Ordinal);
        Assert.Contains("\\;", description, StringComparison.Ordinal);
        Assert.DoesNotContain("\n", description, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Streaming_event_is_located_online()
    {
        var (_, body) = await Get("azure-ai-foundry-shipping-agents");

        Assert.Equal("LOCATION:Streaming online", Line(body, "LOCATION"));
        Assert.Equal("DTSTART;TZID=America/Toronto:20261104T120000", Line(body, "DTSTART"));
    }

    [Fact]
    public async Task Cancelled_event_is_marked_cancelled()
    {
        var (_, body) = await Get("brampton-dev-night-november-social");

        Assert.Equal("STATUS:CANCELLED", Line(body, "STATUS"));
    }

    [Theory]
    [InlineData("does-not-exist")]
    [InlineData("fabric-for-power-bi-developers")]
    public async Task Unknown_or_unpublished_event_is_404(string slug)
    {
        var (response, _) = await Get(slug);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
