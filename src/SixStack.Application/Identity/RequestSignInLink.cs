using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Messages;
using SixStack.Domain.Enums;

namespace SixStack.Application.Identity;

/// <summary>Asks for a sign-in link; the answer never says whether an account exists (L2-046).</summary>
public sealed record RequestSignInLinkCommand(string? Email, string? ReturnUrl) : IRequest;

public sealed class RequestSignInLinkCommandValidator : AbstractValidator<RequestSignInLinkCommand>
{
    public const string EmailMessage = "Enter an email address like name@example.com.";

    public RequestSignInLinkCommandValidator()
    {
        RuleFor(c => c.Email).Cascade(CascadeMode.Stop)
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage(EmailMessage)
            .Matches(@"^[^@\s]+@[^@\s]+\.[^@\s]+$").WithMessage(EmailMessage)
            .MaximumLength(254).WithMessage(EmailMessage);
        RuleFor(c => c.ReturnUrl)
            .Must(IsLocalPath).WithMessage("The return address must be a page on 6ixstack.");
    }

    /// <summary>Only a local path with a single leading slash, so the link cannot redirect off-site.</summary>
    public static bool IsLocalPath(string? url) =>
        url is null || (url.StartsWith('/') && !url.StartsWith("//", StringComparison.Ordinal) && !url.Contains('\\') && url.Length <= 500);
}

/// <summary>
/// Issues a 15-minute single-use sign-in token and emails the link through the outbox. The work is the same for
/// known and unknown addresses (L2-046, L2-084). At most 5 links an hour per address (L2-082).
/// </summary>
public sealed class RequestSignInLinkCommandHandler(
    IAppDbContext db,
    IClock clock,
    IOutbox outbox,
    ISecurityTokenService tokens,
    IOptions<SiteOptions> site) : IRequestHandler<RequestSignInLinkCommand>
{
    public const int HourlyLimitPerEmail = 5;
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(15);

    public async Task Handle(RequestSignInLinkCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var email = request.Email!.Trim().ToLowerInvariant();
        var since = now.AddHours(-1);
        var recent = await db.SecurityTokens
            .Where(t => t.Email == email && t.Purpose == SecurityTokenPurpose.SignIn && t.CreatedAtUtc > since)
            .Select(t => t.CreatedAtUtc)
            .ToListAsync(cancellationToken);
        if (recent.Count >= HourlyLimitPerEmail)
        {
            throw new RateLimitExceededException(recent.Min().AddHours(1) - now);
        }

        var token = tokens.Issue(email, SecurityTokenPurpose.SignIn, Lifetime, request.ReturnUrl);
        var link = $"{site.Value.PublicBaseUrl.TrimEnd('/')}/auth/redeem?token={token}";
        outbox.Enqueue(new SendEmail(new EmailMessage(
            email,
            "Your 6ixstack sign-in link",
            $"Open this link to sign in to 6ixstack. It works once and expires in 15 minutes:\n\n{link}\n\nIf you didn't ask for it, ignore this email.")));
        await db.SaveChangesAsync(cancellationToken);
    }
}
