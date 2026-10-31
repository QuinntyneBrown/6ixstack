using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Domain.Enums;
using SixStack.Infrastructure.Persistence;
using SixStack.Infrastructure.Seeding;

namespace SixStack.Infrastructure.Tests;

public sealed class DatabaseSeederTests : IDisposable
{
    private readonly SqliteDatabase database = new();

    [Fact]
    public async Task Seeds_the_mock_cast()
    {
        await database.RunAsync(sp => Seed(sp));

        var (published, organizer, moderator) = await database.RunAsync(async sp =>
        {
            var db = sp.GetRequiredService<AppDbContext>();
            var upcoming = await db.Events.CountAsync(e => e.Status == EventStatus.Published
                && e.StartsAtUtc >= SqliteDatabase.Today && e.StartsAtUtc < SqliteDatabase.Today.AddDays(14));
            var priya = await db.Users.Include(u => u.Communities).ThenInclude(c => c.Community).SingleAsync(u => u.Email == "priya@gtaazure.ca");
            var jordan = await db.Users.SingleAsync(u => u.Email == "jordan@6ixstack.dev");
            return (upcoming, priya, jordan);
        });

        Assert.Equal(14, published);
        Assert.Equal(UserRole.Organizer, organizer.Role);
        Assert.Equal("GTA Azure Community", Assert.Single(organizer.Communities).Community!.Name);
        Assert.Equal(UserRole.Moderator, moderator.Role);
    }

    [Fact]
    public async Task Seeding_twice_adds_nothing_new()
    {
        await database.RunAsync(sp => Seed(sp));
        var first = await database.RunAsync(sp => Counts(sp));

        await database.RunAsync(sp => Seed(sp));
        var second = await database.RunAsync(sp => Counts(sp));

        Assert.Equal(first, second);
    }

    [Fact]
    public async Task Event_times_are_stored_in_utc_from_toronto_time()
    {
        await database.RunAsync(sp => Seed(sp));

        var startsAt = await database.RunAsync(sp => sp.GetRequiredService<AppDbContext>().Events
            .Where(e => e.Slug == "whats-new-in-dotnet-11-previews").Select(e => e.StartsAtUtc).SingleAsync());

        // Tuesday, November 3, 2026, 6:00 PM EST.
        Assert.Equal(new DateTimeOffset(2026, 11, 3, 23, 0, 0, TimeSpan.Zero), startsAt);
    }

    private static async Task<bool> Seed(IServiceProvider sp)
    {
        await sp.GetRequiredService<DatabaseSeeder>().SeedAsync();
        return true;
    }

    private static async Task<(int, int, int, int)> Counts(IServiceProvider sp)
    {
        var db = sp.GetRequiredService<AppDbContext>();
        return (await db.Events.CountAsync(), await db.Communities.CountAsync(), await db.Speakers.CountAsync(), await db.Users.CountAsync());
    }

    public void Dispose() => database.Dispose();
}
