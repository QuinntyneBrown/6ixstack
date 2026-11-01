using SixStack.Application.Common.Interfaces;

namespace SixStack.Cli;

/// <summary>Marks every audit entry written from the CLI with "via CLI" (L2-112).</summary>
public sealed class CliAuditLog(IAuditLog inner) : IAuditLog
{
    public const string Marker = "via CLI";

    public void Record(string action, string targetType, Guid targetId, string? details = null) =>
        inner.Record(action, targetType, targetId, string.IsNullOrWhiteSpace(details) ? Marker : $"{details}; {Marker}");
}
