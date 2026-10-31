using SixStack.Infrastructure.Services;

namespace SixStack.Infrastructure.Tests;

/// <summary>Tests pin "now"; demos start at the same instant but let time pass, so held emails go out.</summary>
public sealed class SystemClockTests
{
    private static readonly DateTimeOffset Start = new(2026, 11, 2, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task A_fixed_clock_stands_still()
    {
        var clock = new SystemClock(Start);
        await Task.Delay(50);

        Assert.Equal(Start, clock.UtcNow);
    }

    [Fact]
    public async Task A_ticking_clock_starts_at_the_fixed_instant_and_moves_on()
    {
        var clock = new SystemClock(Start, ticking: true);
        var first = clock.UtcNow;
        await Task.Delay(50);

        Assert.InRange(first, Start, Start.AddSeconds(1));
        Assert.True(clock.UtcNow > first);
    }
}
