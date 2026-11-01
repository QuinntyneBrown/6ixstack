using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;

namespace SixStack.Cli;

/// <summary>The CLI's principal: nobody until a write resolves its moderator actor (L2-111).</summary>
public sealed class CliCurrentUser : ICurrentUser
{
    public Guid? UserId { get; private set; }

    public UserRole? Role => UserId is null ? null : UserRole.Moderator;

    public bool IsAuthenticated => UserId is not null;

    public void SignIn(Guid moderatorId) => UserId = moderatorId;
}
