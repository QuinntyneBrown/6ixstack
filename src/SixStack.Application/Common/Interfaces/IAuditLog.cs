namespace SixStack.Application.Common.Interfaces;

/// <summary>Adds an audit entry (L2-086) to the caller's unit of work.</summary>
public interface IAuditLog
{
    void Record(string action, string targetType, Guid targetId, string? details = null);
}
