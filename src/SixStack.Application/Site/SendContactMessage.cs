using FluentValidation;
using MediatR;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Domain.Entities;

namespace SixStack.Application.Site;

/// <summary>A message from the contact page (L2-073); `Topic` is general, listing, partnership, conduct or press.</summary>
public sealed record SendContactMessageCommand(string? Name, string? Email, string? Topic, string? Message) : IRequest<ContactSentDto>;

public sealed record ContactSentDto(string FirstName, string ReplyTo);

public sealed class SendContactMessageCommandValidator : AbstractValidator<SendContactMessageCommand>
{
    public static readonly IReadOnlyDictionary<string, string> Topics = new Dictionary<string, string>
    {
        ["general"] = "General question",
        ["listing"] = "Listing correction",
        ["partnership"] = "Partnership or sponsorship",
        ["conduct"] = "Code of conduct report",
        ["press"] = "Press",
    };

    public SendContactMessageCommandValidator()
    {
        RuleFor(c => c.Name).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter your name.")
            .MaximumLength(120).WithMessage("Keep your name to 120 characters or fewer.");
        RuleFor(c => c.Email).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter an email address like name@example.com")
            .Matches(@"^[^\s@]+@[^\s@]+\.[^\s@]+$").WithMessage("Enter an email address like name@example.com");
        RuleFor(c => c.Topic).Must(t => t is not null && Topics.ContainsKey(t)).WithMessage("Choose what it is about.");
        RuleFor(c => c.Message).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Write a message so we know how to help")
            .MaximumLength(5000).WithMessage("Keep the message to 5,000 characters or fewer.");
    }
}

/// <summary>Stores the message and emails it to hello@, or conduct@ for code of conduct reports (contact-form design).</summary>
public sealed class SendContactMessageCommandHandler(IAppDbContext db, IClock clock, IOutbox outbox) : IRequestHandler<SendContactMessageCommand, ContactSentDto>
{
    public const string TeamInbox = "hello@6ixstack.dev";
    public const string ConductInbox = "conduct@6ixstack.dev";

    public async Task<ContactSentDto> Handle(SendContactMessageCommand c, CancellationToken cancellationToken)
    {
        var name = c.Name!.Trim();
        var email = c.Email!.Trim().ToLowerInvariant();
        var message = c.Message!.Trim();
        db.ContactMessages.Add(new ContactMessage { Name = name, Email = email, Topic = c.Topic!, Message = message, CreatedAtUtc = clock.UtcNow });
        var inbox = c.Topic == "conduct" ? ConductInbox : TeamInbox;
        outbox.Enqueue(new SendEmail(new EmailMessage(
            inbox,
            $"Contact: {SendContactMessageCommandValidator.Topics[c.Topic!]} from {name}",
            $"From: {name}\nReply to: {email}\n\n{message}")));
        await db.SaveChangesAsync(cancellationToken);
        return new ContactSentDto(name.Split(' ')[0], email);
    }
}
