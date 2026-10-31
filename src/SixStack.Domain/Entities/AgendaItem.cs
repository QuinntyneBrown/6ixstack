namespace SixStack.Domain.Entities;

/// <summary>One line of an event's agenda, at a local time on the event day.</summary>
public class AgendaItem
{
    public int Order { get; set; }
    public TimeOnly StartsAtLocal { get; set; }
    public string Title { get; set; } = string.Empty;
}
