namespace SixStack.Domain.Enums;

/// <summary>The fixed topic set. An event, community or speaker carries any combination.</summary>
[Flags]
public enum Topics
{
    None = 0,
    AI = 1,
    DotNet = 2,
    Azure = 4,
    Angular = 8,
    React = 16,
    Aws = 32,
}
