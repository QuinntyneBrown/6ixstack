using System.Diagnostics;

namespace SixStack.Api.Platform;

/// <summary>
/// Outermost middleware (L2-101): assigns the correlation id, returns it in <c>X-Correlation-Id</c>, and writes one
/// structured entry per request with method, route template, final status and duration. It never logs the raw
/// path, query string or body, so tokens and email addresses stay out of the logs.
/// </summary>
public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public const string CorrelationHeader = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = Activity.Current?.TraceId.ToHexString() ?? ActivityTraceId.CreateRandom().ToHexString();
        context.TraceIdentifier = correlationId;
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationHeader] = correlationId;
            return Task.CompletedTask;
        });

        using var scope = logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId });
        var started = Stopwatch.GetTimestamp();
        try
        {
            await next(context);
        }
        finally
        {
            var elapsed = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
            var route = (context.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText
                ?? context.GetEndpoint()?.DisplayName
                ?? "(unmatched)";
            var status = context.Response.StatusCode;
            var level = status >= 500 ? LogLevel.Error
                : route.StartsWith("/health", StringComparison.Ordinal) || route.StartsWith("Health checks", StringComparison.Ordinal) ? LogLevel.Debug
                : LogLevel.Information;
            logger.Log(level, "HTTP {Method} {Route} responded {StatusCode} in {DurationMs} ms", context.Request.Method, route, status, Math.Round(elapsed, 2));
        }
    }
}
