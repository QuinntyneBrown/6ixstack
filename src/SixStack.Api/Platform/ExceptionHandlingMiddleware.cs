using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Common.Exceptions;

namespace SixStack.Api.Platform;

/// <summary>
/// Converts exceptions to RFC 9457 problem details (L2-102). Known failures map to 400, 403, 404, 413 and 429;
/// anything else becomes a 500 with a reference code that is logged with the exception. Bodies never carry
/// exception messages or stack traces.
/// </summary>
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex) when (!context.Response.HasStarted && ex is not OperationCanceledException)
        {
            await WriteProblemAsync(context, ex);
        }
    }

    private async Task WriteProblemAsync(HttpContext context, Exception exception)
    {
        ProblemDetails problem;
        switch (exception)
        {
            case ValidationException validation:
                // Keys follow the API's camelCase JSON, so they match the web app's form control names.
                problem = new ValidationProblemDetails(validation.Errors
                    .GroupBy(e => JsonNamingPolicy.CamelCase.ConvertName(e.PropertyName))
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray()))
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Some fields need attention.",
                };
                break;
            case ForbiddenAccessException forbidden:
                problem = new ProblemDetails { Status = StatusCodes.Status403Forbidden, Title = "You don't have access to this." };
                foreach (var (key, value) in forbidden.Extensions)
                {
                    problem.Extensions[key] = value;
                }

                break;
            case AntiforgeryValidationException:
                problem = new ProblemDetails { Status = StatusCodes.Status400BadRequest, Title = "Your session token is missing or out of date. Reload the page and try again." };
                break;
            case DecisionConflictException conflict:
                problem = new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = conflict.Reason == "too-late" ? "It's too late to undo this." : "Someone already decided this.",
                };
                problem.Extensions["decision"] = conflict.Decision;
                problem.Extensions["decidedBy"] = conflict.DecidedBy;
                problem.Extensions["reason"] = conflict.Reason;
                break;
            case NotFoundException:
                problem = new ProblemDetails { Status = StatusCodes.Status404NotFound, Title = "Not found." };
                break;
            case BadHttpRequestException { StatusCode: StatusCodes.Status413PayloadTooLarge }:
                problem = new ProblemDetails { Status = StatusCodes.Status413PayloadTooLarge, Title = "The request is too large." };
                break;
            case RateLimitExceededException limited:
                problem = new ProblemDetails { Status = StatusCodes.Status429TooManyRequests, Title = "Too many requests. Try again later." };
                context.Response.OnStarting(() =>
                {
                    context.Response.Headers.RetryAfter = ((int)Math.Ceiling(limited.RetryAfter.TotalSeconds)).ToString(System.Globalization.CultureInfo.InvariantCulture);
                    return Task.CompletedTask;
                });
                break;
            default:
                var referenceCode = ReferenceCodeGenerator.New();
                using (logger.BeginScope(new Dictionary<string, object> { ["ReferenceCode"] = referenceCode }))
                {
                    logger.LogError(exception, "Unhandled exception. Reference {ReferenceCode}", referenceCode);
                }

                problem = new ProblemDetails { Status = StatusCodes.Status500InternalServerError, Title = "Something went wrong on our side." };
                problem.Extensions["referenceCode"] = referenceCode;
                break;
        }

        if (problem.Status < 500)
        {
            logger.LogInformation("Request failed with {StatusCode}: {ExceptionType}", problem.Status, exception.GetType().Name);
        }

        problem.Extensions["correlationId"] = context.TraceIdentifier;
        context.Response.Clear();
        context.Response.StatusCode = problem.Status!.Value;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(problem, problem.GetType(), Json));
    }
}
