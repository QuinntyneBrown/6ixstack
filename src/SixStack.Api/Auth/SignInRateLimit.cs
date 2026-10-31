using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace SixStack.Api.Auth;

/// <summary>Per-IP limits (L2-082): 20 sign-in links and 30 custom feed links an hour; configurable for tests.</summary>
public static class SignInRateLimit
{
    public const string Policy = "sign-in-links";
    public const string FeedCreationPolicy = "feed-creation";

    public static IServiceCollection AddSignInRateLimit(this IServiceCollection services, IConfiguration configuration)
    {
        var perHour = configuration.GetValue("Auth:SignInLinks:PerIpPerHour", 20);
        var feedsPerHour = configuration.GetValue("Feeds:CreatePerIpPerHour", 30);
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
            // Custom feed links: 30 an hour per IP address (L2-082, build-custom-feed design).
            options.AddPolicy(FeedCreationPolicy, context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = feedsPerHour, Window = TimeSpan.FromHours(1), QueueLimit = 0 }));
        });
    }
}
