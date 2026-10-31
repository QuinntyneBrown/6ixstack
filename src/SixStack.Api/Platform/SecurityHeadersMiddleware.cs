namespace SixStack.Api.Platform;

/// <summary>Adds the L2-083 headers to every response, including error responses, through <c>OnStarting</c>.</summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public static readonly string ContentSecurityPolicy = string.Join("; ",
        "default-src 'self'",
        "script-src 'self'",
        "connect-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        // Angular component styles are inlined at runtime; a nonce-based policy is a later hardening step (ADR 0006).
        "style-src 'self' 'unsafe-inline'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'");

    public Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            headers.ContentSecurityPolicy = ContentSecurityPolicy;
            headers.XContentTypeOptions = "nosniff";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            return Task.CompletedTask;
        });
        return next(context);
    }
}
