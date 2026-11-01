using Microsoft.AspNetCore.Antiforgery;

namespace SixStack.Api.Auth;

/// <summary>
/// Validates the anti-forgery token on state-changing requests that a session cookie authenticated (L2-083).
/// Runs after authorization, so anonymous calls to protected endpoints still get 401. Anonymous requests carry
/// no session to forge and pass. A missing or wrong token throws, which becomes a 400 problem response.
/// Requests authenticated by an API bearer token are skipped: a browser never attaches an Authorization header to
/// a cross-site request on its own, so there is nothing to forge (L2-121, ADR 0012).
/// </summary>
public sealed class CsrfProtectionMiddleware(RequestDelegate next, IAntiforgery antiforgery)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsGet(context.Request.Method)
            && !HttpMethods.IsHead(context.Request.Method)
            && !HttpMethods.IsOptions(context.Request.Method)
            && !HttpMethods.IsTrace(context.Request.Method)
            && context.User.Identity is { IsAuthenticated: true } identity
            && identity.AuthenticationType != ApiTokenAuthenticationHandler.SchemeName
            && context.GetEndpoint()?.Metadata.GetMetadata<IAntiforgeryMetadata>() is not { RequiresValidation: false })
        {
            await antiforgery.ValidateRequestAsync(context);
        }

        await next(context);
    }
}
