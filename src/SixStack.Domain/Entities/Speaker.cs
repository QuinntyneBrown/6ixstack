using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

public class Speaker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Affiliation { get; set; }
    public string? Bio { get; set; }
    public string? HomeCity { get; set; }
    public Topics Topics { get; set; }
    public string? PublicContactEmail { get; set; }
}
