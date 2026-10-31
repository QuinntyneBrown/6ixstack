using Microsoft.AspNetCore.Antiforgery;

namespace SixStack.Api.Auth;

/// <summary>
/// Validates the anti-forgery token on state-changing requests that a session cookie authenticated (L2-083).
/// Runs after authorization, so anonymous calls to protected endpoints still get 401. Anonymous requests carry
/// no session to forge and pass. A missing or wrong token throws, which becomes a 400 problem response.
/// </summary>
public sealed class CsrfProtectionMiddleware(RequestDelegate next, IAntiforgery antiforgery)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsGet(context.Request.Method)
            && !HttpMethods.IsHead(context.Request.Method)
            && !HttpMethods.IsOptions(context.Request.Method)
            && !HttpMethods.IsTrace(context.Request.Method)
            && context.User.Identity?.IsAuthenticated == true
            && context.GetEndpoint()?.Metadata.GetMetadata<IAntiforgeryMetadata>() is not { RequiresValidation: false })
        {
            await antiforgery.ValidateRequestAsync(context);
        }

        await next(context);
    }
}
