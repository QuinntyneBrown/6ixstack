using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>ADR 0013: the running API gives venues without coordinates a place on the map on its own.</summary>
public sealed class VenueGeocodingJobTests
{
    private sealed class GeocodingApiFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Geocoding:Enabled", "true");
            builder.UseSetting("Geocoding:Interval", "00:00:00.2");
        }
    }

    [Fact]
    public async Task An_event_whose_venue_loses_its_coordinates_returns_to_the_map_without_a_manual_step()
    {
        using var api = new GeocodingApiFactory();
        var client = api.CreateHttpsClient();
        await api.WithDbAsync(async db =>
        {
            var e = await db.Events.SingleAsync(x => x.Slug == "azure-data-ai-day-gta");
            e.Venue!.Latitude = null;
            e.Venue.Longitude = null;
            await db.SaveChangesAsync();
            return 0;
        });

        var onMap = false;
        for (var i = 0; i < 50 && !onMap; i++)
        {
            await Task.Delay(100);
            var map = await (await client.GetAsync("/api/events/map")).Content.ReadFromJsonAsync<JsonElement>();
            onMap = map.GetProperty("points").EnumerateArray().Any(p => p.GetProperty("slug").GetString() == "azure-data-ai-day-gta");
        }

        Assert.True(onMap, "The event never came back to the map.");
    }
}
