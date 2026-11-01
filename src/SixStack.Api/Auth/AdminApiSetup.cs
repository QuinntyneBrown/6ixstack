using Microsoft.AspNetCore.Authentication;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Api.Auth;

/// <summary>The admin API's scheme, policy and audit marker (event-admin-api design, ADR 0012).</summary>
public static class AdminApiSetup
{
    /// <summary>Call after <c>AddApplication</c> and <c>AddSixStackAuth</c>; the cookie scheme stays the default.</summary>
    public static IServiceCollection AddAdminApi(this IServiceCollection services)
    {
        services.AddAuthentication()
            .AddScheme<AuthenticationSchemeOptions, ApiTokenAuthenticationHandler>(ApiTokenAuthenticationHandler.SchemeName, null);
        services.AddAuthorizationBuilder()
            .AddPolicy(AuthPolicies.AdminApi, policy => policy
                .AddAuthenticationSchemes(ApiTokenAuthenticationHandler.SchemeName)
                .RequireAuthenticatedUser()
                .RequireRole(nameof(UserRole.Moderator)));
        services.AddScoped<IAuditLog>(sp => new ApiAuditLog(ActivatorUtilities.CreateInstance<AuditLog>(sp), sp.GetRequiredService<IHttpContextAccessor>()));
        return services;
    }
}
