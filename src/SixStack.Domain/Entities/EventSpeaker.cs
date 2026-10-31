namespace SixStack.Domain.Entities;

public class EventSpeaker
{
    public Guid EventId { get; set; }
    public Event? Event { get; set; }
    public Guid SpeakerId { get; set; }
    public Speaker? Speaker { get; set; }
    public string? TalkTitle { get; set; }
    public int Order { get; set; }
}
