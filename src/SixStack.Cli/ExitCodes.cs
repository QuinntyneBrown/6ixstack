namespace SixStack.Cli;

/// <summary>The CLI's exit codes (L2-110); <c>events</c> errors carry the matching <c>error.code</c>.</summary>
public static class ExitCodes
{
    public const int Success = 0;
    public const int Usage = 1;
    public const int Validation = 2;
    public const int NotFound = 3;
    public const int Conflict = 4;
    public const int Actor = 5;
    public const int NotConfirmed = 6;
    public const int Unexpected = 10;
}
