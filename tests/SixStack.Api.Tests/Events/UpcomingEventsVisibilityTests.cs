using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-001 AC4 (only published, non-cancelled events) and L2-010 AC1 (sold out).</summary>
public sealed class UpcomingEventsVisibilityTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Events_in_review_rejected_draft_deleted_or_cancelled_are_not_listed()
    {
        await factory.WithDbAsync(async db =>
        {
            var events = await db.Events.Where(e => e.Slug == "signals-all-the-way-down" || e.Slug == "bedrock-in-the-real-world"
                || e.Slug == "gta-ai-builders-hackathon" || e.Slug == "server-components-one-year-in" || e.Slug == "rag-evaluation-workshop").ToListAsync();
            events.Single(e => e.Slug == "signals-all-the-way-down").Status = EventStatus.InReview;
            events.Single(e => e.Slug == "bedrock-in-the-real-world").Status = EventStatus.Rejected;
            events.Single(e => e.Slug == "gta-ai-builders-hackathon").Status = EventStatus.Draft;
            events.Single(e => e.Slug == "server-components-one-year-in").Status = EventStatus.Deleted;
            events.Single(e => e.Slug == "rag-evaluation-workshop").CancelledAtUtc = ApiFactory.Today;
            return await db.SaveChangesAsync();
        });

        var page = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/events");
        var slugs = page.GetProperty("days").EnumerateArray().SelectMany(d => d.GetProperty("events").EnumerateArray())
            .Select(e => e.GetProperty("slug").GetString()).ToList();

        Assert.Equal(9, slugs.Count);
        Assert.DoesNotContain("signals-all-the-way-down", slugs);
        Assert.DoesNotContain("rag-evaluation-workshop", slugs);
    }

    [Fact]
    public async Task Sold_out_event_reads_sold_out()
    {
        await factory.WithDbAsync(async db =>
        {
            var e = await db.Events.SingleAsync(x => x.Slug == "azure-data-ai-day-gta");
            e.IsSoldOut = true;
            return await db.SaveChangesAsync();
        });

        var page = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/events");
        var row = page.GetProperty("days").EnumerateArray().SelectMany(d => d.GetProperty("events").EnumerateArray())
            .Single(e => e.GetProperty("slug").GetString() == "azure-data-ai-day-gta");

        Assert.Equal("Sold out", row.GetProperty("priceLabel").GetString());
        Assert.True(row.GetProperty("isSoldOut").GetBoolean());
    }

    [Fact]
    public async Task Prices_group_thousands()
    {
        await factory.WithDbAsync(async db =>
        {
            var e = await db.Events.SingleAsync(x => x.Slug == "landing-zones-that-dont-hurt");
            e.PriceCents = 125_000;
            return await db.SaveChangesAsync();
        });

        var page = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/events?q=landing%20zones");
        var row = page.GetProperty("days").EnumerateArray().SelectMany(d => d.GetProperty("events").EnumerateArray()).Single();

        Assert.Equal("$1,250", row.GetProperty("priceLabel").GetString());
    }
}
