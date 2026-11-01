using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Api.Auth;

/// <summary>
/// The admin API's limits (L2-123, L2-082): a one-minute fixed window per API token (60) and per IP address (120),
/// chained as a global limiter that applies only under <c>/api/admin</c>. Runs before authentication, so the token
/// partition is the id the bearer token names. Configurable for tests.
/// </summary>
public static class AdminApiRateLimit
{
    public const string PathPrefix = "/api/admin";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static IServiceCollection AddAdminApiRateLimit(this IServiceCollection services, IConfiguration configuration)
    {
        var perToken = configuration.GetValue("AdminApi:PerTokenPerMinute", 60);
        var perIp = configuration.GetValue("AdminApi:PerIpPerMinute", 120);
        services.Configure<RateLimiterOptions>(options => options.GlobalLimiter = PartitionedRateLimiter.CreateChained(
            PartitionedRateLimiter.Create<HttpContext, string>(context => IsAdmin(context)
                ? Window($"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}", perIp)
                : RateLimitPartition.GetNoLimiter(string.Empty)),
            PartitionedRateLimiter.Create<HttpContext, string>(context => IsAdmin(context) && TokenId(context) is { } id
                ? Window($"token:{id:N}", perToken)
                : RateLimitPartition.GetNoLimiter(string.Empty))));

        // Under /api/admin a rejection also carries problem details; the existing callback sets Retry-After.
        services.PostConfigure<RateLimiterOptions>(options =>
        {
            var inner = options.OnRejected;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (inner is not null)
                {
                    await inner(context, cancellationToken);
                }

                if (IsAdmin(context.HttpContext))
                {
                    var problem = new ProblemDetails { Status = StatusCodes.Status429TooManyRequests, Title = "Too many requests. Try again later." };
                    problem.Extensions["correlationId"] = context.HttpContext.TraceIdentifier;
                    context.HttpContext.Response.ContentType = "application/problem+json";
                    await context.HttpContext.Response.WriteAsync(JsonSerializer.Serialize(problem, Json), cancellationToken);
                }
            };
        });
        return services;
    }

    private static bool IsAdmin(HttpContext context) => context.Request.Path.StartsWithSegments(PathPrefix);

    private static Guid? TokenId(HttpContext context)
    {
        var header = context.Request.Headers.Authorization.ToString();
        return header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? context.RequestServices.GetRequiredService<IApiTokenHasher>().ReadId(header["Bearer ".Length..].Trim())
            : null;
    }

    private static RateLimitPartition<string> Window(string key, int permits) =>
        RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions { PermitLimit = permits, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 });
}
