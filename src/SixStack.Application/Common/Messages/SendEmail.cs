using SixStack.Application.Common.Interfaces;

namespace SixStack.Application.Common.Messages;

/// <summary>Outbox message that sends one email through <see cref="IEmailSender"/>.</summary>
public sealed record SendEmail(EmailMessage Email);
