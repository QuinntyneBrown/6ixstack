using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace SixStack.Api.Tests.Infrastructure;

public sealed record CapturedLog(string Category, LogLevel Level, string Message, IReadOnlyDictionary<string, object?> State, Exception? Exception);

/// <summary>Records every log entry, with its structured state and enclosing scopes, for assertions.</summary>
public sealed class CapturingLoggerProvider : ILoggerProvider, ISupportExternalScope
{
    private IExternalScopeProvider scopes = new LoggerExternalScopeProvider();

    public ConcurrentQueue<CapturedLog> Entries { get; } = new();

    public ILogger CreateLogger(string categoryName) => new Logger(this, categoryName);

    public void SetScopeProvider(IExternalScopeProvider scopeProvider) => scopes = scopeProvider;

    public void Dispose()
    {
    }

    private sealed class Logger(CapturingLoggerProvider provider, string category) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => provider.scopes.Push(state);

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            var values = new Dictionary<string, object?>();
            provider.scopes.ForEachScope((scope, dict) =>
            {
                if (scope is IEnumerable<KeyValuePair<string, object>> pairs)
                {
                    foreach (var (key, value) in pairs)
                    {
                        dict[key] = value;
                    }
                }
            }, values);
            if (state is IEnumerable<KeyValuePair<string, object?>> statePairs)
            {
                foreach (var (key, value) in statePairs)
                {
                    values[key] = value;
                }
            }

            provider.Entries.Enqueue(new CapturedLog(category, logLevel, formatter(state, exception), values, exception));
        }
    }
}
