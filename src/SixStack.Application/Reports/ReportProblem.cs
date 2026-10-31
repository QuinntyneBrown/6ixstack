using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Application.Notifications;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Reports;

/// <summary>A visitor's report from the event page (L2-039); `Reason` is wrongDetails, cancelled, brokenLink, spam or codeOfConduct.</summary>
public sealed record ReportProblemCommand(string Slug, string? Reason, string? Details, string? ReplyEmail) : IRequest;

public sealed class ReportProblemCommandValidator : AbstractValidator<ReportProblemCommand>
{
    public static readonly IReadOnlyDictionary<string, ReportReason> Reasons = new Dictionary<string, ReportReason>
    {
        ["wrongDetails"] = ReportReason.WrongDetails,
        ["cancelled"] = ReportReason.Cancelled,
        ["brokenLink"] = ReportReason.BrokenLink,
        ["spam"] = ReportReason.Spam,
        ["codeOfConduct"] = ReportReason.CodeOfConduct,
    };

    public ReportProblemCommandValidator()
    {
        RuleFor(c => c.Reason).Must(r => r is not null && Reasons.ContainsKey(r))
            .WithMessage("Choose what is wrong so we can route it to the right person.");
        RuleFor(c => c.Details).MaximumLength(2000).WithMessage("Keep the details to 2,000 characters or fewer.");
        When(c => !string.IsNullOrWhiteSpace(c.ReplyEmail), () =>
            RuleFor(c => c.ReplyEmail).EmailAddress().WithMessage("Enter an email address like name@example.com.")
                .MaximumLength(254).WithMessage("Enter an email address like name@example.com."));
    }
}

/// <summary>
/// Stores the report and notifies (L2-040): moderators always, linking to the edit page; the event's organizers for
/// anything but a conduct concern, quoting the details and never the reporter. A conduct concern goes to two
/// moderators only. Organizers with report emails on also get an email.
/// </summary>
public sealed class ReportProblemCommandHandler(IAppDbContext db, IClock clock, IOutbox outbox, EmailPolicy emails, IOptions<SiteOptions> site)
    : IRequestHandler<ReportProblemCommand>
{
    public const int ConductModerators = 2;

    public async Task Handle(ReportProblemCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var e = await db.Events.Include(x => x.Community).ThenInclude(c => c!.Organizers).ThenInclude(o => o.User)
            .SingleOrDefaultAsync(x => x.Slug == request.Slug && x.Status == EventStatus.Published, cancellationToken)
            ?? throw new NotFoundException("Event not found.");
        var reason = ReportProblemCommandValidator.Reasons[request.Reason!];
        var details = string.IsNullOrWhiteSpace(request.Details) ? null : request.Details.Trim();
        db.ProblemReports.Add(new ProblemReport
        {
            EventId = e.Id,
            Reason = reason,
            Details = details,
            ReplyEmail = string.IsNullOrWhiteSpace(request.ReplyEmail) ? null : request.ReplyEmail.Trim().ToLowerInvariant(),
            CreatedAtUtc = now,
        });

        var moderators = await db.Users.Where(u => u.Role == UserRole.Moderator).OrderBy(u => u.Email).Select(u => u.Email).ToListAsync(cancellationToken);
        var quote = details is null ? null : $"“{details}” ";
        if (reason == ReportReason.CodeOfConduct)
        {
            foreach (var moderator in moderators.Take(ConductModerators))
            {
                Notify(moderator, $"Code of conduct concern about {e.Title}", $"{quote}Only moderators see this report.", $"/organize/events/{e.Id}/edit", "danger", now);
            }
        }
        else
        {
            var title = Title(reason, e.Title);
            foreach (var moderator in moderators)
            {
                Notify(moderator, title, $"{quote}Check the listing and edit it if needed.", $"/organize/events/{e.Id}/edit", "warning", now);
            }

            var organizers = (e.Community?.Organizers.Select(o => o.User?.Email) ?? [])
                .Append(e.SubmitterEmail)
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .Select(m => m!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var text = $"{quote}Check and update the listing if needed.";
            foreach (var organizer in organizers)
            {
                Notify(organizer, title, text, "/organize", "warning", now);
                if (await emails.WantsAsync(organizer, p => p.ProblemReports, cancellationToken))
                {
                    outbox.Enqueue(new SendEmail(new EmailMessage(organizer, title, $"{text}\n\nYour events: {site.Value.PublicBaseUrl.TrimEnd('/')}/organize")));
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>The notification title per reason, such as "Someone reported the time on Azure Data & AI Day GTA".</summary>
    public static string Title(ReportReason reason, string eventTitle) => reason switch
    {
        ReportReason.WrongDetails => $"Someone reported the time on {eventTitle}",
        ReportReason.Cancelled => $"Someone says {eventTitle} is cancelled",
        ReportReason.BrokenLink => $"Someone reported a broken link on {eventTitle}",
        ReportReason.Spam => $"Someone reported {eventTitle} as spam",
        _ => $"Code of conduct concern about {eventTitle}",
    };

    private void Notify(string to, string title, string text, string link, string tone, DateTimeOffset now) =>
        db.Notifications.Add(new Notification { RecipientEmail = to, Title = title, Text = text, Link = link, Tone = tone, CreatedAtUtc = now });
}
