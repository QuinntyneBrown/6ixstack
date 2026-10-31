using SixStack.Infrastructure.Notifications;

namespace SixStack.Infrastructure.Tests.Notifications;

/// <summary>The weekly summary runs Mondays at 8:00 AM Toronto time (email-notifications decisions).</summary>
public sealed class WeeklySummaryJobTests
{
    [Theory]
    [InlineData("2026-11-02T14:00:00Z", "2026-11-09T13:00:00Z")] // Monday 9:00 AM ET: next week
    [InlineData("2026-11-02T12:30:00Z", "2026-11-02T13:00:00Z")] // Monday 7:30 AM ET: today at 8
    [InlineData("2026-11-01T20:00:00Z", "2026-11-02T13:00:00Z")] // Sunday afternoon: tomorrow
    [InlineData("2026-10-26T11:00:00Z", "2026-10-26T12:00:00Z")] // Monday before the clocks change (EDT)
    public void The_next_run_is_the_next_Monday_at_8_in_Toronto(string now, string expected)
    {
        Assert.Equal(DateTimeOffset.Parse(expected), WeeklySummaryJob.NextRun(DateTimeOffset.Parse(now)));
    }
}
