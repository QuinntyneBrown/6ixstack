using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Application.Common.Behaviors;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Moderation;

namespace SixStack.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(assembly);
        services.AddScoped<ISubmissionCheckScheduler, SubmissionCheckScheduler>();
        services.AddScoped<IOutboxMessageHandler<RunSubmissionChecks>, RunSubmissionChecksHandler>();
        return services;
    }
}
