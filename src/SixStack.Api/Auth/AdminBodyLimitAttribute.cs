using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SixStack.Api.Auth;

/// <summary>
/// Admin API bodies are at most 64 KB (L2-123, L2-081): the server's own limit is lowered where it can be, and a
/// larger <c>Content-Length</c> is refused with 413 before model binding reads anything.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AdminBodyLimitAttribute : Attribute, IResourceFilter
{
    public const long MaxBytes = 64 * 1024;

    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        if (context.HttpContext.Features.Get<IHttpMaxRequestBodySizeFeature>() is { IsReadOnly: false } feature)
        {
            feature.MaxRequestBodySize = MaxBytes;
        }

        if (context.HttpContext.Request.ContentLength > MaxBytes)
        {
            throw new BadHttpRequestException("The request body is too large.", StatusCodes.Status413PayloadTooLarge);
        }
    }

    public void OnResourceExecuted(ResourceExecutedContext context)
    {
    }
}
