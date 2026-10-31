using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.Organizer;

/// <summary>L2-054, L2-055 and L2-062: GET and PUT /api/organizer/events/{id}.</summary>
public sealed class EditEventTests
{
    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static Task<Guid> Id(ApiFactory factory, string slug) =>
        factory.WithDbAsync(db => db.Events.Where(e => e.Slug == slug).Select(e => e.Id).SingleAsync());

    /// <summary>The details form of Azure Data & AI Day GTA as the edit page sends it, with overrides.</summary>
    private static Dictionary<string, object?> Day(params (string Key, object? Value)[] changes)
    {
        var body = new Dictionary<string, object?>
        {
            ["title"] = "Azure Data & AI Day GTA",
            ["organizerName"] = "GTA Azure Community",
            ["description"] = "A full day of Fabric, Azure OpenAI and data platform sessions from local MVPs, with a hands-on lab track.",
            ["topics"] = new[] { "azure", "ai" },
            ["date"] = "2026-11-05",
            ["timeZoneId"] = "America/Toronto",
            ["startTime"] = "09:00",
            ["endTime"] = "17:00",
            ["format"] = "hybrid",
            ["venueName"] = "Living Arts Centre",
            ["city"] = "Mississauga",
            ["streetAddress"] = "4141 Living Arts Dr",
            ["streamUrl"] = null,
            ["isFree"] = false,
            ["priceCad"] = 49m,
            ["ticketUrl"] = null,
        };
        foreach (var (key, value) in changes)
        {
            body[key] = value;
        }

        return body;
    }

    [Fact]
    public async Task The_edit_page_gets_the_details_and_the_status_line()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var e = await priya.GetFromJsonAsync<JsonElement>($"/api/organizer/events/{await Id(factory, "azure-data-ai-day-gta")}");

        Assert.Equal("Published · 318 going · last edited Oct 28", e.GetProperty("statusLine").GetString());
        Assert.False(e.GetProperty("isReadOnly").GetBoolean());
        var d = e.GetProperty("details");
        Assert.Equal(("Azure Data & AI Day GTA", "2026-11-05", "09:00", "17:00", "hybrid", "Living Arts Centre", "Mississauga", false, 49m),
            (d.GetProperty("title").GetString(), d.GetProperty("date").GetString(), d.GetProperty("startTime").GetString(), d.GetProperty("endTime").GetString(),
             d.GetProperty("format").GetString(), d.GetProperty("venueName").GetString(), d.GetProperty("city").GetString(), d.GetProperty("isFree").GetBoolean(), d.GetProperty("priceCad").GetDecimal()));
        Assert.Equal(["ai", "azure"], d.GetProperty("topics").EnumerateArray().Select(t => t.GetString()));
    }

    [Fact]
    public async Task A_past_event_opens_read_only()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var e = await priya.GetFromJsonAsync<JsonElement>($"/api/organizer/events/{await Id(factory, "copilot-studio-for-developers")}");

        Assert.True(e.GetProperty("isReadOnly").GetBoolean());
        Assert.StartsWith("Thursday, October 29, 2026 · ", e.GetProperty("readOnlyLead").GetString());
    }

    [Fact]
    public async Task Another_communitys_event_is_forbidden_and_names_its_owner()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var id = await Id(factory, "landing-zones-that-dont-hurt");

        var read = await priya.GetAsync($"/api/organizer/events/{id}");
        var write = await priya.PutAsJsonAsync($"/api/organizer/events/{id}", Day(("title", "Hijacked")));

        Assert.Equal(HttpStatusCode.Forbidden, read.StatusCode);
        var problem = await read.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(("Azure Toronto", "Landing zones that don't hurt", HttpClientExtensions.Organizer),
            (problem.GetProperty("communityName").GetString(), problem.GetProperty("eventTitle").GetString(), problem.GetProperty("signedInEmail").GetString()));
        Assert.Equal(HttpStatusCode.Forbidden, write.StatusCode);
        Assert.Equal("Landing zones that don't hurt", await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.Title).SingleAsync()));
    }

    [Fact]
    public async Task Moving_a_published_start_time_applies_at_once_and_flags_the_change()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var id = await Id(factory, "azure-data-ai-day-gta");
        var before = await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.Sequence).SingleAsync());

        var response = await priya.PutAsJsonAsync($"/api/organizer/events/{id}", Day(("startTime", "09:30")));

        response.EnsureSuccessStatusCode();
        var saved = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(("published", 318), (saved.GetProperty("status").GetString(), saved.GetProperty("goingCount").GetInt32()));
        var detail = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/events/azure-data-ai-day-gta");
        Assert.Contains(detail.GetProperty("alerts").EnumerateArray(), a => a.GetProperty("title").GetString() == "Start time changed to 9:30 AM");
        Assert.Equal(before + 1, await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.Sequence).SingleAsync()));
    }

    [Fact]
    public async Task Invalid_details_return_the_form_messages()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var response = await priya.PutAsJsonAsync($"/api/organizer/events/{await Id(factory, "azure-data-ai-day-gta")}",
            Day(("streetAddress", ""), ("ticketUrl", "tickets.example.org/azure-data-ai-day")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter the street address.", errors.GetProperty("streetAddress")[0].GetString());
        Assert.Equal("Enter a full link that starts with https://", errors.GetProperty("ticketUrl")[0].GetString());
    }

    [Fact]
    public async Task Saving_a_needs_changes_event_sends_it_back_to_review()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var id = await Id(factory, "azure-bicep-clinic");

        var response = await priya.PutAsJsonAsync($"/api/organizer/events/{id}", Day(
            ("title", "Azure Bicep clinic"), ("date", "2026-11-24"), ("startTime", "18:00"), ("endTime", "20:00"), ("format", "inPerson"),
            ("venueName", "Microsoft Canada"), ("city", "Toronto"), ("streetAddress", "81 Bay St, 30th floor"), ("isFree", true), ("priceCad", null)));

        response.EnsureSuccessStatusCode();
        Assert.Equal("inReview", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        Assert.Equal(EventStatus.InReview, await factory.WithDbAsync(db => db.Events.Where(e => e.Id == id).Select(e => e.Status).SingleAsync()));
        var queue = await (await As(factory, HttpClientExtensions.Moderator)).GetFromJsonAsync<JsonElement>("/api/moderation/queue");
        Assert.Contains(queue.GetProperty("cards").EnumerateArray(), c => c.GetProperty("title").GetString() == "Azure Bicep clinic");
    }

    [Fact]
    public async Task A_moderator_edit_keeps_the_status_and_is_audited()
    {
        using var factory = new ApiFactory();
        var jordan = await As(factory, HttpClientExtensions.Moderator);
        var id = await Id(factory, "fabric-for-power-bi-developers");
        var e = await jordan.GetFromJsonAsync<JsonElement>($"/api/organizer/events/{id}");
        var details = JsonSerializer.Deserialize<Dictionary<string, object?>>(e.GetProperty("details").GetRawText())!;
        details["title"] = "Fabric for Power BI developers, hands on";

        var response = await jordan.PutAsJsonAsync($"/api/organizer/events/{id}", details);

        response.EnsureSuccessStatusCode();
        Assert.Equal("inReview", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        var audit = await factory.WithDbAsync(db => db.AuditEntries.Where(a => a.TargetId == id && a.Action == "EventEdited").SingleAsync());
        var jordanId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.Moderator).Select(u => u.Id).SingleAsync());
        Assert.Equal((jordanId, "title"), (audit.ActorId, audit.Details));
    }

    [Fact]
    public async Task A_past_event_cannot_be_saved()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var response = await priya.PutAsJsonAsync($"/api/organizer/events/{await Id(factory, "copilot-studio-for-developers")}", Day(("date", "2026-11-30")));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Anonymous_callers_are_refused()
    {
        using var factory = new ApiFactory();

        var response = await factory.CreateHttpsClient().GetAsync($"/api/organizer/events/{await Id(factory, "azure-data-ai-day-gta")}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
