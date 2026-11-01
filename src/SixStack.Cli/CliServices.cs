using Microsoft.Extensions.DependencyInjection;
using SixStack.Application;

namespace SixStack.Cli;

/// <summary>Composes the services the <c>events</c> commands need on top of the infrastructure.</summary>
public static class CliServices
{
    public static IServiceCollection AddEventAdministration(this IServiceCollection services) => services.AddApplication();
}
