using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;

namespace SixStack.Infrastructure.Email;

public sealed class SendEmailHandler(IEmailSender sender) : IOutboxMessageHandler<SendEmail>
{
    public Task HandleAsync(SendEmail message, CancellationToken cancellationToken) =>
        sender.SendAsync(message.Email, cancellationToken);
}
