using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Net.Http.Headers;

namespace SixStack.Api.Platform;

/// <summary>
/// The public event listings' HTTP cache (platform/event-listing-cache): a strong <c>ETag</c> over the body and
/// 304 for a matching <c>If-None-Match</c> (L2-126).
/// </summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class EventListingCacheAttribute : Attribute, IAsyncResourceFilter
{
    public async Task OnResourceExecutionAsync(ResourceExecutingContext context, ResourceExecutionDelegate next)
    {
        var http = context.HttpContext;
        var original = http.Response.Body;
        using var buffer = new MemoryStream();
        http.Response.Body = buffer;
        ResourceExecutedContext executed;
        try
        {
            executed = await next();
        }
        finally
        {
            http.Response.Body = original;
        }

        // An unhandled exception (a validation failure, say) goes on to ExceptionHandlingMiddleware unwritten.
        if (executed.Exception is not null && !executed.ExceptionHandled)
        {
            return;
        }

        var status = http.Response.StatusCode;
        var body = buffer.ToArray();
        if (status is StatusCodes.Status200OK or StatusCodes.Status204NoContent)
        {
            await WriteAsync(http, status, body, ETagOf(body));
            return;
        }

        await original.WriteAsync(body, http.RequestAborted);
    }

    private static async Task WriteAsync(HttpContext http, int status, byte[] body, string etag)
    {
        http.Response.Headers.ETag = etag;
        if (Matches(http.Request.Headers.IfNoneMatch, etag))
        {
            http.Response.StatusCode = StatusCodes.Status304NotModified;
            http.Response.ContentLength = 0;
            http.Response.Headers.ContentType = default;
            return;
        }

        http.Response.StatusCode = status;
        http.Response.ContentLength = body.Length;
        await http.Response.Body.WriteAsync(body, http.RequestAborted);
    }

    /// <summary>The first 16 bytes of the body's SHA-256 hash as quoted lower-case hex, as the feeds use.</summary>
    internal static string ETagOf(byte[] body) => $"\"{Convert.ToHexStringLower(SHA256.HashData(body).AsSpan(0, 16))}\"";

    private static bool Matches(Microsoft.Extensions.Primitives.StringValues ifNoneMatch, string etag)
    {
        if (ifNoneMatch.Count == 0)
        {
            return false;
        }

        return EntityTagHeaderValue.TryParseList(ifNoneMatch, out var tags)
            && tags.Any(t => t.Equals(EntityTagHeaderValue.Any) || t.Tag.Equals(etag, StringComparison.Ordinal));
    }
}
