using SixStack.Domain.Enums;

namespace SixStack.Application.Submissions;

/// <summary>The words for a rejection reason, shared by the reject dialog's email and the dashboard banner.</summary>
public static class RejectionText
{
    public static string Label(RejectionReason reason) => Moderation.RejectSubmissionCommand.Labels[reason];
}
