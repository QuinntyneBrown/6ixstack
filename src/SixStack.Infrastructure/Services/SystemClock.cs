using System.Diagnostics;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Infrastructure.Services;

/// <summary>
/// Real time, or a fixed instant when <c>Clock:FixedUtcNow</c> is set (tests and Playwright). With
/// <c>Clock:Ticking</c> the fixed instant is only the start and time passes from there (demos), so held messages
/// such as the approval email come due.
/// </summary>
public sealed class SystemClock(DateTimeOffset? fixedUtcNow = null, bool ticking = false) : IClock
{
    private readonly Stopwatch elapsed = Stopwatch.StartNew();

    public DateTimeOffset UtcNow => fixedUtcNow is { } start
        ? (ticking ? start + elapsed.Elapsed : start)
        : DateTimeOffset.UtcNow;
}
