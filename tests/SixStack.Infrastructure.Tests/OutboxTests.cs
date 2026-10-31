using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Infrastructure.Email;
using SixStack.Infrastructure.Outbox;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Infrastructure.Tests;

/// <summary>L2-103: background work runs after the user's change commits and retries with backoff up to 5 attempts.</summary>
public sealed class OutboxTests : IDisposable
{
    private static readonly EmailMessage Welcome = new("priya@gtaazure.ca", "Hello", "Hi Priya");

    private readonly FlakySender flaky = new();
    private readonly SqliteDatabase database;

    public OutboxTests()
    {
        database = new SqliteDatabase(services => services.AddSingleton<IEmailSender>(flaky));
    }

    [Fact]
    public async Task Enqueued_email_is_sent_by_the_dispatcher_once()
    {
        flaky.FailuresLeft = 0;
        await Enqueue(new SendEmail(Welcome));

        await Dispatch();
        await Dispatch();

        Assert.Equal(1, flaky.Sent);
        var message = await Single();
        Assert.NotNull(message.ProcessedAtUtc);
    }

    [Fact]
    public async Task Failed_attempt_is_retried_after_the_base_delay()
    {
        flaky.FailuresLeft = 1;
        await Enqueue(new SendEmail(Welcome));

        await Dispatch();

        var message = await Single();
        Assert.Equal(1, message.AttemptCount);
        Assert.Null(message.ProcessedAtUtc);
        Assert.Equal(SqliteDatabase.Today + new OutboxOptions().RetryBaseDelay, message.NextAttemptAtUtc);
    }

    [Fact]
    public async Task Message_that_is_not_due_is_left_alone()
    {
        flaky.FailuresLeft = 1;
        await Enqueue(new SendEmail(Welcome));
        await Dispatch();

        var processed = await Dispatch();

        Assert.Equal(0, processed);
    }

    private Task<bool> Enqueue<T>(T message) where T : notnull => database.RunAsync(async sp =>
    {
        sp.GetRequiredService<IOutbox>().Enqueue(message);
        await sp.GetRequiredService<IAppDbContext>().SaveChangesAsync();
        return true;
    });

    private Task<int> Dispatch() => database.RunAsync(sp => sp.GetRequiredService<OutboxDispatcher>().ProcessDueAsync(CancellationToken.None));

    private Task<Domain.Entities.OutboxMessage> Single() =>
        database.RunAsync(sp => sp.GetRequiredService<AppDbContext>().OutboxMessages.AsNoTracking().SingleAsync());

    public void Dispose() => database.Dispose();

    private sealed class FlakySender : IEmailSender
    {
        public int FailuresLeft { get; set; }

        public int Sent { get; private set; }

        public Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
        {
            if (FailuresLeft > 0)
            {
                FailuresLeft--;
                throw new InvalidOperationException("Provider unavailable");
            }

            Sent++;
            return Task.CompletedTask;
        }
    }
}
