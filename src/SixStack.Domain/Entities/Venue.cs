namespace SixStack.Domain.Entities;

/// <summary>Where an in-person or hybrid event takes place. Owned by <see cref="Event"/>.</summary>
public class Venue
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string City { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
