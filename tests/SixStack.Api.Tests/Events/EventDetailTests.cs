using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-017 to L2-022 and L2-024: GET /api/events/{slug}, with "now" Monday, November 2, 2026, 9:00 AM ET.</summary>
public sealed class EventDetailTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<JsonElement> Get(string slug)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/events/{slug}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static string? Str(JsonElement e, string name) =>
        e.TryGetProperty(name, out var v) && v.ValueKind != JsonValueKind.Null ? v.GetString() : null;

    [Fact]
    public async Task Upcoming_hybrid_event_has_its_facts_agenda_and_speakers()
    {
        var e = await Get("azure-data-ai-day-gta");

        Assert.Equal("upcoming", Str(e, "state"));
        Assert.Equal("Azure Data & AI Day GTA", Str(e, "title"));
        Assert.Equal(("Nov", "5"), (Str(e.GetProperty("dateTile"), "month"), Str(e.GetProperty("dateTile"), "day")));
        Assert.Equal("gta-azure-community", Str(e.GetProperty("community"), "slug"));
        var when = e.GetProperty("facts").GetProperty("when");
        Assert.Equal("Thursday, November 5, 2026", Str(when, "dateLabel"));
        Assert.Equal("9:00 AM – 5:00 PM ET", Str(when, "timeRange"));
        var venue = e.GetProperty("facts").GetProperty("venue");
        Assert.Equal("Living Arts Centre", Str(venue, "name"));
        Assert.Equal("4141 Living Arts Dr, Mississauga", Str(venue, "address"));
        Assert.StartsWith("https://www.google.com/maps/search/?api=1&query=", Str(venue, "directionsUrl"));
        Assert.Equal("Livestream available", Str(e.GetProperty("facts").GetProperty("stream"), "label"));
        Assert.Equal("$49 · includes lunch", Str(e.GetProperty("facts").GetProperty("price"), "label"));
        var attendance = e.GetProperty("facts").GetProperty("attendance");
        Assert.Equal(("318 going", "Capacity 400"), (Str(attendance, "label"), Str(attendance, "note")));
        var agenda = e.GetProperty("agenda").EnumerateArray().ToList();
        Assert.Equal(6, agenda.Count);
        Assert.Equal(("9:00 AM", "Registration and coffee"), (Str(agenda[0], "time"), Str(agenda[0], "title")));
        Assert.Equal(["priya-natarajan", "marcus-bell", "aisha-rahman", "kenji-watanabe"],
            e.GetProperty("speakers").EnumerateArray().Select(s => Str(s, "slug")));
        Assert.Empty(e.GetProperty("alerts").EnumerateArray());
    }

    [Fact]
    public async Task Upcoming_event_offers_tickets_calendar_share_report_and_a_docked_bar()
    {
        var actions = (await Get("azure-data-ai-day-gta")).GetProperty("actions");
        var docked = (await Get("azure-data-ai-day-gta")).GetProperty("dockedBar");

        var primary = actions.GetProperty("primary");
        Assert.Equal("Get tickets · $49", Str(primary, "label"));
        Assert.Equal("https://tickets.example.com/azure-data-ai-day-gta", Str(primary, "url"));
        Assert.True(actions.GetProperty("addToCalendar").GetBoolean());
        Assert.True(actions.GetProperty("share").GetBoolean());
        Assert.True(actions.GetProperty("report").GetBoolean());
        Assert.Equal("Tickets are sold by the organizer. 6ixstack never charges attendees.", Str(actions, "caption"));
        Assert.Equal("Thu, Nov 5 · 9:00 AM", Str(docked, "when"));
        Assert.Equal("$49 · 318 going", Str(docked, "summary"));
        Assert.Equal("Get tickets", Str(docked.GetProperty("action"), "label"));
    }

    [Fact]
    public async Task Free_event_offers_register()
    {
        var primary = (await Get("whats-new-in-dotnet-11-previews")).GetProperty("actions").GetProperty("primary");

        Assert.Equal("Register", Str(primary, "label"));
    }

    [Fact]
    public async Task Streaming_event_shows_source_time_and_countdown_without_the_stream_link()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/events/azure-ai-foundry-shipping-agents");
        var body = await response.Content.ReadAsStringAsync();
        var e = JsonDocument.Parse(body).RootElement;

        var when = e.GetProperty("facts").GetProperty("when");
        Assert.Equal("12:00 PM – 1:30 PM ET", Str(when, "timeRange"));
        Assert.Equal("9:00 AM PT", Str(when, "sourceTime"));
        Assert.Equal("Streaming online", Str(e.GetProperty("facts").GetProperty("stream"), "label"));
        var alert = Assert.Single(e.GetProperty("alerts").EnumerateArray());
        Assert.Equal(("info", "Starts in 2 days"), (Str(alert, "kind"), Str(alert, "title")));
        Assert.Equal("We'll show the stream link here 15 minutes before 12:00 PM ET.", Str(alert, "text"));
        var join = e.GetProperty("actions").GetProperty("join");
        Assert.Equal(JsonValueKind.Null, join.GetProperty("url").ValueKind);
        Assert.Equal("2026-11-04T16:45:00+00:00", Str(join, "opensAtUtc"));
        Assert.DoesNotContain("stream.example.com", body);
        Assert.Equal(JsonValueKind.Null, e.GetProperty("actions").GetProperty("primary").ValueKind);
    }

    [Fact]
    public async Task Past_event_has_ended_with_recording_slides_and_the_next_event()
    {
        var e = await Get("minimal-apis-in-practice-october");

        Assert.Equal("past", Str(e, "state"));
        var when = e.GetProperty("facts").GetProperty("when");
        Assert.Equal(("Tuesday, October 20, 2026", "6:00 PM – 8:30 PM ET", "ended"), (Str(when, "dateLabel"), Str(when, "timeRange"), Str(when, "suffix")));
        Assert.Equal("131 attended", Str(e.GetProperty("facts").GetProperty("attendance"), "label"));
        var alert = e.GetProperty("alerts")[0];
        Assert.Equal(("info", "This event has ended"), (Str(alert, "kind"), Str(alert, "title")));
        Assert.Equal("Toronto .NET User Group meets again on November 3.", Str(alert, "text"));
        Assert.Equal(("See the next one", "/events/whats-new-in-dotnet-11-previews"), (Str(alert.GetProperty("action"), "label"), Str(alert.GetProperty("action"), "href")));
        var actions = e.GetProperty("actions");
        Assert.NotNull(Str(actions, "recordingUrl"));
        Assert.NotNull(Str(actions, "slidesUrl"));
        Assert.Equal(JsonValueKind.Null, actions.GetProperty("primary").ValueKind);
        Assert.False(actions.GetProperty("addToCalendar").GetBoolean());
        Assert.Equal(JsonValueKind.Null, e.GetProperty("dockedBar").ValueKind);
    }

    [Fact]
    public async Task Cancelled_event_puts_the_cancellation_first_and_offers_alternatives_only()
    {
        var e = await Get("brampton-dev-night-november-social");

        Assert.Equal("cancelled", Str(e, "state"));
        Assert.Equal("cancelled", Str(e.GetProperty("facts").GetProperty("when"), "suffix"));
        var alert = e.GetProperty("alerts")[0];
        Assert.Equal(("danger", "Cancelled by the organizer on November 1"), (Str(alert, "kind"), Str(alert, "title")));
        Assert.Equal("“Our venue had a scheduling conflict. We're rebooking for January and will post the new date here.” — Brampton Dev Night", Str(alert, "text"));
        var actions = e.GetProperty("actions");
        Assert.Equal(JsonValueKind.Null, actions.GetProperty("primary").ValueKind);
        Assert.Equal(JsonValueKind.Null, actions.GetProperty("join").ValueKind);
        Assert.False(actions.GetProperty("addToCalendar").GetBoolean());
        Assert.False(actions.GetProperty("share").GetBoolean());
        Assert.Equal(("Find another .NET or Angular event", "/?topics=dotnet,angular"), (Str(actions.GetProperty("findAnother"), "label"), Str(actions.GetProperty("findAnother"), "href")));
        Assert.Equal(("Follow Brampton Dev Night", "/communities/brampton-dev-night"), (Str(actions.GetProperty("follow"), "label"), Str(actions.GetProperty("follow"), "href")));
        Assert.Equal(JsonValueKind.Null, e.GetProperty("dockedBar").ValueKind);
    }

    [Theory]
    [InlineData("does-not-exist")]
    [InlineData("fabric-for-power-bi-developers")]
    public async Task Unknown_or_unpublished_event_is_404(string slug)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/events/{slug}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

/// <summary>L2-022 status alerts, which need data changes.</summary>
public sealed class EventDetailAlertTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<List<JsonElement>> Alerts(string slug)
    {
        var e = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>($"/api/events/{slug}");
        return [.. e.GetProperty("alerts").EnumerateArray()];
    }

    private Task Change(string slug, Action<Domain.Entities.Event> change) => factory.WithDbAsync(async db =>
    {
        change(await db.Events.SingleAsync(e => e.Slug == slug));
        return await db.SaveChangesAsync();
    });

    [Fact]
    public async Task Recent_time_change_shows_a_warning_with_update_my_calendar()
    {
        await Change("bedrock-in-the-real-world", e =>
        {
            e.PreviousStartsAtUtc = e.StartsAtUtc;
            e.StartsAtUtc = e.StartsAtUtc.AddMinutes(30);
            e.TimeChangedAtUtc = ApiFactory.Today.AddHours(-2);
        });

        var alert = Assert.Single(await Alerts("bedrock-in-the-real-world"));

        Assert.Equal(("warning", "Start time changed to 6:30 PM"), (alert.GetProperty("kind").GetString(), alert.GetProperty("title").GetString()));
        Assert.Equal("Updated by AWS User Group Toronto 2 hours ago. Calendar feeds update automatically; re-add it if you saved a file.", alert.GetProperty("text").GetString());
        Assert.Equal("Update my calendar", alert.GetProperty("action").GetProperty("label").GetString());
    }

    [Fact]
    public async Task Time_change_older_than_seven_days_is_not_shown()
    {
        await Change("gta-ai-builders-hackathon", e => e.TimeChangedAtUtc = ApiFactory.Today.AddDays(-8));

        Assert.Empty(await Alerts("gta-ai-builders-hackathon"));
    }

    [Fact]
    public async Task Sold_out_event_shows_a_danger_alert_with_the_waitlist()
    {
        await Change("rag-evaluation-workshop", e => e.IsSoldOut = true);

        var alert = Assert.Single(await Alerts("rag-evaluation-workshop"));

        Assert.Equal(("danger", "Sold out"), (alert.GetProperty("kind").GetString(), alert.GetProperty("title").GetString()));
        Assert.Equal("All tickets are gone. Join the waitlist on the ticket page.", alert.GetProperty("text").GetString());
        Assert.Equal("Join the waitlist", alert.GetProperty("action").GetProperty("label").GetString());
        Assert.Equal("https://tickets.example.com/rag-evaluation-workshop", alert.GetProperty("action").GetProperty("href").GetString());
    }

    [Fact]
    public async Task Confirmation_and_organizer_note_show_as_success_and_info()
    {
        await Change("landing-zones-that-dont-hurt", e =>
        {
            e.ConfirmedAtUtc = new DateTimeOffset(2026, 11, 1, 15, 0, 0, TimeSpan.Zero);
            e.NoteTitle = "Doors open at 6:30";
            e.NoteText = "Check in at the Spaces front desk on the 2nd floor.";
        });

        var alerts = await Alerts("landing-zones-that-dont-hurt");

        Assert.Equal(["success", "info"], alerts.Select(a => a.GetProperty("kind").GetString()));
        Assert.Equal("Confirmed by the organizer", alerts[0].GetProperty("title").GetString());
        Assert.Equal("Azure Toronto confirmed the date, venue and livestream on November 1.", alerts[0].GetProperty("text").GetString());
        Assert.Equal(("Doors open at 6:30", "Check in at the Spaces front desk on the 2nd floor."), (alerts[1].GetProperty("title").GetString(), alerts[1].GetProperty("text").GetString()));
    }
}

/// <summary>L2-019 AC3: inside the join window the stream link is present.</summary>
public sealed class EventDetailJoinWindowTests(EventDetailJoinWindowTests.JoinWindowFactory factory) : IClassFixture<EventDetailJoinWindowTests.JoinWindowFactory>
{
    [Fact]
    public async Task Stream_link_appears_fifteen_minutes_before_the_start()
    {
        var e = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/events/azure-ai-foundry-shipping-agents");

        var join = e.GetProperty("actions").GetProperty("join");
        Assert.Equal("Join the stream", join.GetProperty("label").GetString());
        Assert.Equal("https://stream.example.com/azure-ai-foundry-shipping-agents", join.GetProperty("url").GetString());
        Assert.DoesNotContain(e.GetProperty("alerts").EnumerateArray(), a => a.GetProperty("title").GetString()!.StartsWith("Starts in", StringComparison.Ordinal));
    }

    /// <summary>"Now" is Wednesday, November 4, 2026, 11:46 AM ET: 14 minutes before the Reactor stream.</summary>
    public sealed class JoinWindowFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Clock:FixedUtcNow", "2026-11-04T16:46:00Z");
        }
    }
}
