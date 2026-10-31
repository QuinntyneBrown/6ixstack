using Microsoft.Extensions.DependencyInjection;
using SixStack.Application.Common.Interfaces;
using SixStack.Infrastructure.Email;

namespace SixStack.Infrastructure.Tests;

public sealed class DevMailboxTests : IDisposable
{
    private readonly SqliteDatabase database = new();

    [Fact]
    public async Task Sent_email_lands_in_the_dev_mailbox_instead_of_leaving_the_machine()
    {
        await database.RunAsync(async sp =>
        {
            await sp.GetRequiredService<IEmailSender>().SendAsync(new EmailMessage("priya@gtaazure.ca", "Your sign-in link", "Open it"));
            return true;
        });

        var entry = Assert.Single(database.Services.GetRequiredService<DevMailbox>().For("PRIYA@gtaazure.ca"));
        Assert.Equal("Your sign-in link", entry.Message.Subject);
        Assert.Equal(SqliteDatabase.Today, entry.ReceivedAtUtc);
    }

    public void Dispose() => database.Dispose();
}
