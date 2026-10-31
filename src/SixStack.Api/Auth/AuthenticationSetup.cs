using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Api.Auth;

public static class AuthenticationSetup
{
    /// <summary>
    /// Cookie session authentication and the organizer and moderator policies (L2-080, L2-083).
    /// The magic-link sign-in flow that issues sessions arrives with journey 05; until then only
    /// the test sign-in seam signs anyone in.
    /// </summary>
    public static IServiceCollection AddSixStackAuth(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, HttpCurrentUser>();
        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = AuthPolicies.SessionCookie;
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.Path = "/";
                options.ExpireTimeSpan = TimeSpan.FromDays(14);
                options.SlidingExpiration = true;
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            });

        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())
            .AddPolicy(AuthPolicies.Organizer, policy => policy.RequireRole(nameof(UserRole.Organizer)))
            .AddPolicy(AuthPolicies.Moderator, policy => policy.RequireRole(nameof(UserRole.Moderator)));
        return services;
    }
}
