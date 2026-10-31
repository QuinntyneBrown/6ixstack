namespace SixStack.Application.Moderation;

/// <summary>Settings for the automated checks (section <c>SubmissionChecks</c>).</summary>
public sealed class SubmissionChecksOptions
{
    public const string Section = "SubmissionChecks";

    /// <summary><c>Http</c> requests links; <c>AssumeReachable</c> keeps tests, Playwright and demos off the network.</summary>
    public string LinkChecker { get; set; } = "Http";

    /// <summary>Whole words or phrases that make a submission a developer topic. Maintained here until a screen exists.</summary>
    public string[] DeveloperKeywords { get; set; } =
    [
        "developer", "developers", "programming", "code", "coding", "software", "engineering", "api", "apis", "sdk",
        "cloud", "devops", "kubernetes", "docker", "containers", "serverless", "microservices", "data", "database",
        "postgres", "sql", "fabric", "power bi", "lakehouse", "analytics", "ai", "machine learning", "llm", "agents",
        "semantic kernel", "openai", "azure", "aws", "gcp", ".net", "dotnet", "c#", "blazor", "rust", "go", "python",
        "java", "javascript", "typescript", "node", "react", "angular", "vue", "frontend", "front-end", "backend",
        "web", "mobile", "security", "testing", "open source", "github", "cosmos db", "minimal apis",
    ];
}
