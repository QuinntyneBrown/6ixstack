using SixStack.Application.Common.Interfaces;

namespace SixStack.Api.Auth;

/// <summary>Marks every audit entry written with an API token with "via API" (L2-122); cookie requests are unchanged.</summary>
public sealed class ApiAuditLog(IAuditLog inner, IHttpContextAccessor accessor) : IAuditLog
{
    public const string Marker = "via API";

    public void Record(string action, string targetType, Guid targetId, string? details = null)
    {
        if (accessor.HttpContext?.User.Identity is { IsAuthenticated: true, AuthenticationType: ApiTokenAuthenticationHandler.SchemeName })
        {
            details = string.IsNullOrWhiteSpace(details) ? Marker : $"{details}; {Marker}";
        }

        inner.Record(action, targetType, targetId, details);
    }
}
