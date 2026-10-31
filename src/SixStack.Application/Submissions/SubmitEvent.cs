using System.Globalization;
using System.Text.RegularExpressions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Application.Common.Time;
using SixStack.Application.Common.Validation;
using SixStack.Application.Moderation;
using SixStack.Application.ReferenceData;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Submissions;

/// <summary>A submission from the submit page; property names match the form's controls (L2-041).</summary>
public sealed record SubmitEventCommand(
    string? Title,
    string? OrganizerName,
    string? Description,
    IReadOnlyList<string>? Topics,
    string? Date,
    string? TimeZoneId,
    string? StartTime,
    string? EndTime,
    string? Format,
    string? VenueName,
    string? City,
    string? StreetAddress,
    string? StreamUrl,
    bool IsFree,
    decimal? PriceCad,
    string? TicketUrl,
    string? ContactEmail) : IRequest<SubmissionReceivedDto>
{
    public static readonly string[] Formats = ["inPerson", "streaming", "hybrid"];

    public bool HasVenue => Format is "inPerson" or "hybrid";

    public static bool TryTime(string? value, out TimeOnly time) =>
        TimeOnly.TryParseExact(value ?? string.Empty, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);

    public static bool TryDate(string? value, out DateOnly date) =>
        DateOnly.TryParseExact(value ?? string.Empty, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
}

public sealed record SubmissionReceivedDto(string EventTitle, string ContactEmail);

/// <summary>The L2-041 and L2-042 rules, with the form's own messages, so server errors land on the same fields.</summary>
public sealed class SubmitEventCommandValidator : AbstractValidator<SubmitEventCommand>
{
    public SubmitEventCommandValidator(IClock clock)
    {
        RuleFor(c => c.Title).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter a title for the event.")
            .MaximumLength(90).WithMessage("Keep the title to 90 characters or fewer.");
        RuleFor(c => c.OrganizerName).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter the community or organizer.")
            .MaximumLength(120).WithMessage("Keep the organizer to 120 characters or fewer.");
        RuleFor(c => c.Description).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Describe the event in a sentence or two.")
            .MaximumLength(2000).WithMessage("Keep the description to 2,000 characters or fewer.");
        RuleFor(c => c.Topics)
            .Must(t => t is { Count: > 0 } && t.All(TopicKeys.ByKey.ContainsKey)).WithMessage("Pick at least one topic so people can find it.");
        RuleFor(c => c.Date).Cascade(CascadeMode.Stop)
            .Must(v => SubmitEventCommand.TryDate(v, out _)).WithMessage("Enter the date.")
            .Must(v => SubmitEventCommand.TryDate(v, out var d) && d >= TorontoTime.Today(clock.UtcNow)).WithMessage("Choose a date that hasn't passed.");
        RuleFor(c => c.TimeZoneId)
            .Must(v => GetReferenceDataQuery.TimeZones.Any(z => z.Id == v)).WithMessage("Choose a time zone.");
        RuleFor(c => c.StartTime)
            .Must(v => SubmitEventCommand.TryTime(v, out _)).WithMessage("Enter a start time.");
        RuleFor(c => c.EndTime).Cascade(CascadeMode.Stop)
            .Must(v => SubmitEventCommand.TryTime(v, out _)).WithMessage("Enter an end time.")
            .Must((c, v) => !SubmitEventCommand.TryTime(c.StartTime, out var start) || (SubmitEventCommand.TryTime(v, out var end) && end > start))
            .WithMessage(c => SubmitEventCommand.TryTime(c.StartTime, out var start)
                ? $"End time must be after the {start.ToString("h:mm tt", CultureInfo.GetCultureInfo("en-US"))} start."
                : "End time must be after the start.");
        RuleFor(c => c.Format)
            .Must(v => SubmitEventCommand.Formats.Contains(v)).WithMessage("Choose in person, streaming or hybrid.");

        When(c => c.HasVenue, () =>
        {
            RuleFor(c => c.VenueName).Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter the venue name.")
                .MaximumLength(200).WithMessage("Keep the venue name to 200 characters or fewer.");
            RuleFor(c => c.StreetAddress).Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter the street address.")
                .MaximumLength(200).WithMessage("Keep the address to 200 characters or fewer.");
            RuleFor(c => c.City).Must(v => GetReferenceDataQuery.Cities.Contains(v)).WithMessage("Choose a city.");
        });
        When(c => c.Format == "streaming", () =>
        {
            RuleFor(c => c.VenueName).Must(string.IsNullOrWhiteSpace).WithMessage("A streaming event has no venue.");
            RuleFor(c => c.StreetAddress).Must(string.IsNullOrWhiteSpace).WithMessage("A streaming event has no venue.");
        });
        When(c => c.Format == "inPerson", () =>
            RuleFor(c => c.StreamUrl).Must(string.IsNullOrWhiteSpace).WithMessage("An in-person event has no livestream link."));
        When(c => !string.IsNullOrWhiteSpace(c.StreamUrl) && c.Format != "inPerson", () => RuleFor(c => c.StreamUrl).MustBeHttpsUrl());
        When(c => !string.IsNullOrWhiteSpace(c.TicketUrl), () => RuleFor(c => c.TicketUrl).MustBeHttpsUrl());
        When(c => !c.IsFree, () =>
            RuleFor(c => c.PriceCad).Cascade(CascadeMode.Stop)
                .Must(p => p is > 0).WithMessage("Enter a price above $0.")
                .Must(p => p <= 10_000).WithMessage("Enter a price of $10,000 or less."));
        RuleFor(c => c.ContactEmail).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter your email address.")
            .EmailAddress().WithMessage("Enter an email address like name@example.com.")
            .MaximumLength(254).WithMessage("Enter an email address like name@example.com.");
    }
}

/// <summary>
/// Stores the event in review, emails a confirmation and, on the first submission from an address, a verification
/// link (L2-043, L2-085). Emails go through the outbox, so a provider failure never fails the submission.
/// </summary>
public sealed partial class SubmitEventCommandHandler(
    IAppDbContext db,
    IClock clock,
    IOutbox outbox,
    ISecurityTokenService tokens,
    ISubmissionCheckScheduler checks,
    IOptions<SiteOptions> site) : IRequestHandler<SubmitEventCommand, SubmissionReceivedDto>
{
    public const int DailyLimitPerEmail = 10;
    public static readonly TimeSpan VerificationLifetime = TimeSpan.FromHours(24);

    public async Task<SubmissionReceivedDto> Handle(SubmitEventCommand c, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var email = c.ContactEmail!.Trim().ToLowerInvariant();
        var since = now.AddDays(-1);
        var recent = await db.Events.Where(e => e.SubmitterEmail == email && e.SubmittedAtUtc > since)
            .Select(e => e.SubmittedAtUtc).ToListAsync(cancellationToken);
        if (recent.Count >= DailyLimitPerEmail)
        {
            throw new RateLimitExceededException(recent.Min()!.Value.AddDays(1) - now);
        }

        var firstFromAddress = recent.Count == 0
            && !await db.Events.AnyAsync(e => e.SubmitterEmail == email, cancellationToken)
            && !await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email, cancellationToken);

        var e = await NewEvent(c, email, now, cancellationToken);
        db.Events.Add(e);
        await checks.ScheduleAsync(e, cancellationToken);

        var baseUrl = site.Value.PublicBaseUrl.TrimEnd('/');
        outbox.Enqueue(new SendEmail(new EmailMessage(
            email,
            $"We got “{e.Title}”",
            $"Thanks for submitting “{e.Title}” to 6ixstack.\n\nA moderator checks the details, usually within a day. We email you when it's live, or what to fix if something is missing.\n\n{baseUrl}")));
        if (firstFromAddress)
        {
            var token = tokens.Issue(email, SecurityTokenPurpose.VerifyEmail, VerificationLifetime);
            outbox.Enqueue(new SendEmail(new EmailMessage(
                email,
                "Verify your email to publish events",
                $"Confirm that {email} is yours so your events can go live once a moderator approves them:\n\n{baseUrl}/auth/verify-email?token={token}\n\nThe link works for 24 hours.")));
        }

        await db.SaveChangesAsync(cancellationToken);
        return new SubmissionReceivedDto(e.Title, email);
    }

    private async Task<Event> NewEvent(SubmitEventCommand c, string email, DateTimeOffset now, CancellationToken cancellationToken)
    {
        SubmitEventCommand.TryDate(c.Date, out var date);
        SubmitEventCommand.TryTime(c.StartTime, out var start);
        SubmitEventCommand.TryTime(c.EndTime, out var end);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(c.TimeZoneId!);
        DateTimeOffset ToUtc(TimeOnly time)
        {
            var local = date.ToDateTime(time);
            return new DateTimeOffset(local, zone.GetUtcOffset(local)).ToUniversalTime();
        }

        var format = c.Format switch { "streaming" => EventFormat.Streaming, "hybrid" => EventFormat.Hybrid, _ => EventFormat.InPerson };
        return new Event
        {
            Slug = await UniqueSlug(c.Title!, cancellationToken),
            Title = c.Title!.Trim(),
            OrganizerName = c.OrganizerName!.Trim(),
            Description = c.Description!.Trim(),
            Topics = TopicKeys.Parse(c.Topics!),
            Status = EventStatus.InReview,
            Format = format,
            StartsAtUtc = ToUtc(start),
            EndsAtUtc = ToUtc(end),
            TimeZoneId = c.TimeZoneId!,
            SourceTimeZoneId = c.TimeZoneId == "America/Toronto" ? null : c.TimeZoneId,
            Venue = c.HasVenue ? new Venue { Name = c.VenueName!.Trim(), Address = c.StreetAddress!.Trim(), City = c.City! } : null,
            StreamUrl = format == EventFormat.InPerson ? null : Clean(c.StreamUrl),
            TicketUrl = Clean(c.TicketUrl),
            PriceCents = c.IsFree ? 0 : (int)Math.Round(c.PriceCad!.Value * 100),
            SubmitterEmail = email,
            SubmittedAtUtc = now,
        };
    }

    private async Task<string> UniqueSlug(string title, CancellationToken cancellationToken)
    {
        var slug = NonSlug().Replace(title.ToLowerInvariant(), "-").Trim('-');
        slug = slug.Length > 100 ? slug[..100].TrimEnd('-') : slug;
        var candidate = slug;
        for (var n = 2; await db.Events.AnyAsync(e => e.Slug == candidate, cancellationToken); n++)
        {
            candidate = $"{slug}-{n}";
        }

        return candidate;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlug();
}
