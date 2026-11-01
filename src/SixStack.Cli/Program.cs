using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using SixStack.Cli;
using SixStack.Infrastructure;

var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = [],
    ContentRootPath = AppContext.BaseDirectory,
});
builder.Configuration.AddEnvironmentVariables();
builder.Services.AddInfrastructure(builder.Configuration).AddEventAdministration();

using var host = builder.Build();
return await CliApp.RunAsync(args, host.Services, Console.Out, Console.IsInputRedirected ? null : Console.In);
