using SixStack.Domain.Enums;

namespace SixStack.Application.Common.Interfaces;

/// <summary>Application view of the authenticated principal.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
}
