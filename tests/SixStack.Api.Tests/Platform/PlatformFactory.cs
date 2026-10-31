using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Platform;

public sealed class PlatformFactory : ApiFactory
{
    public CapturingLoggerProvider Logs { get; } = new();

    protected override void ConfigureTestServices(IServiceCollection services)
    {
        services.AddControllers().AddApplicationPart(typeof(ProbeController).Assembly);
        services.AddLogging(builder => builder.AddProvider(Logs).SetMinimumLevel(LogLevel.Debug));
    }

    public IEnumerable<CapturedLog> RequestLogs => Logs.Entries.Where(e => e.Category.EndsWith("RequestLoggingMiddleware", StringComparison.Ordinal));
}
