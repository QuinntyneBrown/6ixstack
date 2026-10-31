using FluentValidation;

namespace SixStack.Application.Common.Validation;

public static class HttpsUrlRules
{
    public const string Message = "Enter a full link that starts with https://";

    /// <summary>Accepts only absolute https:// URLs (L2-081); rejects javascript:, data:, http: and the rest.</summary>
    public static IRuleBuilderOptions<T, string?> MustBeHttpsUrl<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(value => Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps)
            .WithMessage(Message);
}
