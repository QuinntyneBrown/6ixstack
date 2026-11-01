using Microsoft.Extensions.DependencyInjection;
using SixStack.Application;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Cli;

/// <summary>Composes the services the <c>events</c> commands need on top of the infrastructure.</summary>
public static class CliServices
{
    public static IServiceCollection AddEventAdministration(this IServiceCollection services)
    {
        services.AddApplication();
        services.AddScoped<CliCurrentUser>();
        services.AddScoped<ICurrentUser>(sp => sp.GetRequiredService<CliCurrentUser>());
        services.AddScoped<IAuditLog>(sp => new CliAuditLog(ActivatorUtilities.CreateInstance<AuditLog>(sp)));
        return services;
    }
}
