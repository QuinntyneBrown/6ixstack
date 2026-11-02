using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Application.Common.Interfaces;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-129: cached listings expire after the absolute lifetime and at the next Toronto midnight.</summary>
public sealed class EventListingExpiryTests
{
    /// <summary>The API with a clock the test moves.</summary>
    private sealed class MovableClockFactory : ApiFactory
    {
        public sealed class MovableClock : IClock
        {
            public DateTimeOffset UtcNow { get; set; } = Today;
        }

        public MovableClock Clock { get; } = new();

        protected override void ConfigureTestServices(IServiceCollection services) => services.Replace(ServiceDescriptor.Singleton<IClock>(Clock));
    }

    // 9:00 AM ET on Monday, November 2, 2026, is 14:00 UTC.
    private static readonly DateTimeOffset NineAm = ApiFactory.Today;

    private static Task<JsonElement> Get(ApiFactory factory, string url) => factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>(url);

    private static List<string?> Titles(JsonElement page) =>
        [.. page.GetProperty("days").EnumerateArray().SelectMany(d => d.GetProperty("events").EnumerateArray()).Select(e => e.GetProperty("title").GetString())];

    /// <summary>Saves a title through a context of its own with no interceptor, as the CLI's process does.</summary>
    private static async Task RenameFromAnotherProcess(MovableClockFactory factory, string slug, string title)
    {
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(factory.ConnectionString).Options);
        (await db.Events.SingleAsync(e => e.Slug == slug)).Title = title;
        await db.SaveChangesAsync();
    }

    // L2-129 #1
    [Fact]
    public async Task A_listing_cached_before_toronto_midnight_is_computed_again_after_it()
    {
        using var factory = new MovableClockFactory();
        factory.Clock.UtcNow = new DateTimeOffset(2026, 11, 3, 4, 59, 0, TimeSpan.Zero); // 11:59 PM ET, November 2
        var before = await Get(factory, "/api/events/map");
        Assert.Equal("2026-11-02", before.GetProperty("days")[0].GetProperty("date").GetString());

        factory.Clock.UtcNow = new DateTimeOffset(2026, 11, 3, 5, 0, 0, TimeSpan.Zero); // 12:00 AM ET, November 3
        var after = await Get(factory, "/api/events/map");

        Assert.Equal("2026-11-03", after.GetProperty("days")[0].GetProperty("date").GetString());
    }

    // L2-129 #2, #4
    [Fact]
    public async Task A_change_from_another_process_shows_once_the_lifetime_ends()
    {
        using var factory = new MovableClockFactory();
        factory.Clock.UtcNow = NineAm;
        await Get(factory, "/api/events");
        await RenameFromAnotherProcess(factory, "bedrock-in-the-real-world", "Bedrock, renamed from the CLI");

        factory.Clock.UtcNow = NineAm.AddMinutes(5);

        Assert.Contains("Bedrock, renamed from the CLI", Titles(await Get(factory, "/api/events")));
    }

    // L2-129 #3
    [Fact]
    public async Task Within_the_lifetime_the_listing_comes_from_memory()
    {
        using var factory = new MovableClockFactory();
        factory.Clock.UtcNow = NineAm;
        await Get(factory, "/api/events");
        await RenameFromAnotherProcess(factory, "bedrock-in-the-real-world", "Bedrock, renamed from the CLI");

        factory.Clock.UtcNow = NineAm.AddMinutes(4);

        Assert.DoesNotContain("Bedrock, renamed from the CLI", Titles(await Get(factory, "/api/events")));
    }
}
