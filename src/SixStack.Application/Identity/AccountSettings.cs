using System.Globalization;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Application.Common.Time;
using SixStack.Application.Common.Validation;
using SixStack.Domain.Enums;

namespace SixStack.Application.Identity;

public sealed record SettingsCommunityDto(string Name, string Slug, int CoOrganizerCount);

public sealed record AccountSettingsDto(
    string Name,
    string Email,
    string? PendingEmail,
    string? Website,
    bool EmailEventDecisions,
    bool EmailProblemReports,
    bool EmailWeeklySummary,
    SettingsCommunityDto? Community);

/// <summary>The signed-in person's settings (L2-068 to L2-070).</summary>
public sealed record GetAccountSettingsQuery : IRequest<AccountSettingsDto>;

/// <summary>Saves the profile and email switches; a new email waits for its confirmation link (L2-068, L2-069).</summary>
public sealed record UpdateAccountSettingsCommand(
    string? Name,
    string? Email,
    string? Website,
    bool EmailEventDecisions,
    bool EmailProblemReports,
    bool EmailWeeklySummary) : IRequest<SettingsSavedDto>;

public sealed record SettingsSavedDto(string SavedAtLabel, string? PendingEmail);

/// <summary>Confirms a new email from its link; false for an unknown, used or expired link.</summary>
public sealed record ConfirmEmailChangeCommand(string Token) : IRequest<bool>;

public sealed class UpdateAccountSettingsCommandValidator : AbstractValidator<UpdateAccountSettingsCommand>
{
    public UpdateAccountSettingsCommandValidator()
    {
        RuleFor(c => c.Name).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter your name.")
            .MaximumLength(100).WithMessage("Keep your name to 100 characters or fewer.");
        RuleFor(c => c.Email).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Enter your email address.")
            .EmailAddress().WithMessage("Enter an email address like name@example.com.");
        When(c => !string.IsNullOrWhiteSpace(c.Website), () =>
            RuleFor(c => c.Website).Must(v => Uri.TryCreate(v!.Trim(), UriKind.Absolute, out var u) && u.Scheme == Uri.UriSchemeHttps && u.Host.Contains('.'))
                .WithMessage("Enter a full link like https://gtaazure.ca"));
    }
}

public sealed class AccountSettingsHandlers(
    IAppDbContext db,
    IClock clock,
    ICurrentUser current,
    IOutbox outbox,
    ISecurityTokenService tokens,
    IOptions<SiteOptions> site)
    : IRequestHandler<GetAccountSettingsQuery, AccountSettingsDto>,
      IRequestHandler<UpdateAccountSettingsCommand, SettingsSavedDto>,
      IRequestHandler<ConfirmEmailChangeCommand, bool>
{
    public static readonly TimeSpan ConfirmationLifetime = TimeSpan.FromHours(24);
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<AccountSettingsDto> Handle(GetAccountSettingsQuery request, CancellationToken cancellationToken)
    {
        var user = await db.Users.AsNoTracking().Include(u => u.Communities).ThenInclude(c => c.Community)
            .SingleAsync(u => u.Id == current.UserId, cancellationToken);
        var membership = user.Communities.FirstOrDefault();
        SettingsCommunityDto? community = null;
        if (membership?.Community is { } c)
        {
            var others = await db.CommunityOrganizers.CountAsync(o => o.CommunityId == c.Id && o.UserId != user.Id, cancellationToken);
            community = new SettingsCommunityDto(c.Name, c.Slug, others);
        }

        var p = user.EmailPreferences;
        return new AccountSettingsDto(user.Name ?? string.Empty, user.Email, user.PendingEmail, user.WebsiteUrl, p.EventDecisions, p.ProblemReports, p.WeeklySummary, community);
    }

    public async Task<SettingsSavedDto> Handle(UpdateAccountSettingsCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var user = await db.Users.SingleAsync(u => u.Id == current.UserId, cancellationToken);
        user.Name = request.Name!.Trim();
        user.WebsiteUrl = string.IsNullOrWhiteSpace(request.Website) ? null : request.Website.Trim();
        user.EmailPreferences.EventDecisions = request.EmailEventDecisions;
        user.EmailPreferences.ProblemReports = request.EmailProblemReports;
        user.EmailPreferences.WeeklySummary = request.EmailWeeklySummary;

        var email = request.Email!.Trim().ToLowerInvariant();
        if (email != user.Email && email != user.PendingEmail)
        {
            if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
            {
                throw new ValidationException([new FluentValidation.Results.ValidationFailure(nameof(request.Email), "That address belongs to another account.")]);
            }

            user.PendingEmail = email;
            var token = tokens.Issue(email, SecurityTokenPurpose.ChangeEmail, ConfirmationLifetime);
            outbox.Enqueue(new SendEmail(new EmailMessage(
                email,
                "Confirm your new email for 6ixstack",
                $"Confirm that {email} is yours, and 6ixstack will use it from then on. Until then you keep signing in with {user.Email}.\n\n{site.Value.PublicBaseUrl.TrimEnd('/')}/auth/confirm-email?token={token}\n\nThe link works for 24 hours.")));
        }
        else if (email == user.Email)
        {
            user.PendingEmail = null;
        }

        await db.SaveChangesAsync(cancellationToken);
        return new SettingsSavedDto(TorontoTime.Time(now), user.PendingEmail);
    }

    public async Task<bool> Handle(ConfirmEmailChangeCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var hash = tokens.Hash(request.Token);
        var token = await db.SecurityTokens.SingleOrDefaultAsync(t => t.TokenHash == hash && t.Purpose == SecurityTokenPurpose.ChangeEmail, cancellationToken);
        if (token is null || !token.IsUsable(now))
        {
            return false;
        }

        var user = await db.Users.SingleOrDefaultAsync(u => u.PendingEmail == token.Email, cancellationToken);
        if (user is null || await db.Users.AnyAsync(u => u.Email == token.Email, cancellationToken))
        {
            return false;
        }

        token.UsedAtUtc = now;
        user.Email = token.Email;
        user.PendingEmail = null;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
