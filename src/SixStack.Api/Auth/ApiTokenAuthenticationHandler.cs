using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SixStack.Application.ApiTokens;

namespace SixStack.Api.Auth;

/// <summary>
/// The <c>ApiToken</c> scheme (ADR 0012): reads <c>Authorization: Bearer &lt;token&gt;</c> and authenticates the
/// token's owner. It runs only for endpoints whose policy names it, so no other endpoint reads a bearer token
/// (L2-121). Challenges and forbids answer with problem details.
/// </summary>
public sealed class ApiTokenAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, ISender sender)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "ApiToken";
    public const string TokenIdClaim = "token_id";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return AuthenticateResult.NoResult();
        }

        var principal = await sender.Send(new AuthenticateApiTokenCommand(header["Bearer ".Length..].Trim()), Context.RequestAborted);
        if (principal is null)
        {
            return AuthenticateResult.Fail("The API token is not valid.");
        }

        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, principal.UserId.ToString()),
                new Claim(ClaimTypes.Email, principal.Email),
                new Claim(ClaimTypes.Role, principal.Role.ToString()),
                new Claim(TokenIdClaim, principal.TokenId.ToString()),
            ],
            SchemeName);
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.Headers.WWWAuthenticate = "Bearer";
        return WriteProblemAsync(StatusCodes.Status401Unauthorized, "Send a valid API token as Authorization: Bearer <token>.");
    }

    protected override Task HandleForbiddenAsync(AuthenticationProperties properties) =>
        WriteProblemAsync(StatusCodes.Status403Forbidden, "Only a moderator's API token can manage events.");

    private Task WriteProblemAsync(int status, string title)
    {
        var problem = new ProblemDetails { Status = status, Title = title };
        problem.Extensions["correlationId"] = Context.TraceIdentifier;
        Response.StatusCode = status;
        Response.ContentType = "application/problem+json";
        return Response.WriteAsync(JsonSerializer.Serialize(problem, Json));
    }
}
