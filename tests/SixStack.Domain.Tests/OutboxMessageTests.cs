using SixStack.Domain.Entities;

namespace SixStack.Domain.Tests;

public sealed class OutboxMessageTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 2, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Retry_delay_doubles_after_each_failure()
    {
        var message = new OutboxMessage { NextAttemptAtUtc = Now };
        var delays = new List<TimeSpan>();

        for (var i = 0; i < 4; i++)
        {
            message.MarkFailed("boom", Now, TimeSpan.FromSeconds(30));
            delays.Add(message.NextAttemptAtUtc - Now);
        }

        Assert.Equal([TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(60), TimeSpan.FromSeconds(120), TimeSpan.FromSeconds(240)], delays);
        Assert.Null(message.FailedAtUtc);
    }

    [Fact]
    public void Fifth_failure_gives_up()
    {
        var message = new OutboxMessage();

        for (var i = 0; i < OutboxMessage.MaxAttempts; i++)
        {
            message.MarkFailed("boom", Now, TimeSpan.FromSeconds(30));
        }

        Assert.Equal(Now, message.FailedAtUtc);
        Assert.Equal("boom", message.LastError);
    }
}
