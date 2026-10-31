using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace SixStack.Api.Auth;

/// <summary>At most 20 sign-in link requests an hour from one IP address (L2-082); configurable for tests.</summary>
public static class SignInRateLimit
{
    public const string Policy = "sign-in-links";

    public static IServiceCollection AddSignInRateLimit(this IServiceCollection services, IConfiguration configuration)
    {
        var perHour = configuration.GetValue("Auth:SignInLinks:PerIpPerHour", 20);
        return services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, _) =>
            {
                var retry = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var after) ? after : TimeSpan.FromHours(1);
                context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retry.TotalSeconds)).ToString(System.Globalization.CultureInfo.InvariantCulture);
                return ValueTask.CompletedTask;
            };
            options.AddPolicy(Policy, context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = perHour, Window = TimeSpan.FromHours(1), QueueLimit = 0 }));
        });
    }
}
