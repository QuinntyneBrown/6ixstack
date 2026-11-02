using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Net.Http.Headers;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Api.Platform;

/// <summary>
/// The public event listings' cache (platform/event-listing-cache). Before model binding it answers a stored entry
/// (L2-125); otherwise it buffers the action's body and stores a 200 or 204 under the generation read before the
/// action ran. Either way it sends a strong <c>ETag</c> over the body and 304 for a matching <c>If-None-Match</c>
/// (L2-126). Errors are written by <c>ExceptionHandlingMiddleware</c> and never stored.
/// </summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class EventListingCacheAttribute : Attribute, IAsyncResourceFilter
{
    public async Task OnResourceExecutionAsync(ResourceExecutingContext context, ResourceExecutionDelegate next)
    {
        var http = context.HttpContext;
        var cache = http.RequestServices.GetRequiredService<IEventListingCache>();
        var key = EventListingCacheKey.For(http.Request.Path, http.Request.Query);
        if (cache.TryGet(key) is { } stored)
        {
            await WriteAsync(http, stored.StatusCode, stored.ContentType, stored.Body, stored.ETag);
            return;
        }

        var generation = cache.Generation;
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
            var etag = ETagOf(body);
            var contentType = http.Response.ContentType;
            cache.Set(key, new CachedListing(status, contentType, body, etag), generation);
            await WriteAsync(http, status, contentType, body, etag);
            return;
        }

        await original.WriteAsync(body, http.RequestAborted);
    }

    private static async Task WriteAsync(HttpContext http, int status, string? contentType, byte[] body, string etag)
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
        http.Response.ContentType = contentType;
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
