using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;
using SixStack.Cli;
using SixStack.Infrastructure;

var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = [],
    ContentRootPath = AppContext.BaseDirectory,
});
builder.Configuration.AddEnvironmentVariables();

// Logs go to standard error, so standard output holds only the command's result (one JSON document with --json).
builder.Services.Configure<ConsoleLoggerOptions>(o => o.LogToStandardErrorThreshold = LogLevel.Trace);
builder.Services.AddInfrastructure(builder.Configuration).AddEventAdministration();

using var host = builder.Build();
return await CliApp.RunAsync(args, host.Services, Console.Out, Console.IsInputRedirected ? null : Console.In);
