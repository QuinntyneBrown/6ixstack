using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Infrastructure.Seeding;

/// <summary>The cast and catalogue from docs/mocks/README.md. "Today" in the mocks is Monday, November 2, 2026.</summary>
internal static class SeedData
{
    public sealed record CommunitySeed(string Slug, string Name, string Initials, string City, int Members, Topics Topics, string Description);

    public sealed record SpeakerSeed(string Slug, string Name, string Initials, string Role, string Affiliation, Topics Topics, string HomeCity);

    public sealed record VenueSeed(string Name, string? Address, string City, double Latitude, double Longitude);

    public sealed record EventSeed(
        string Slug,
        string Title,
        string Community,
        string Description,
        Topics Topics,
        EventFormat Format,
        string Date,
        string Start,
        string End,
        VenueSeed? Venue,
        string? SourceTimeZoneId,
        int PriceCents,
        int Going,
        EventStatus Status = EventStatus.Published,
        bool Featured = false,
        string? SubmitterEmail = null,
        (string Speaker, string Talk)[]? Speakers = null,
        Action<Event>? Details = null,
        double? SubmittedHoursAgo = null,
        double? ReviewHours = null,
        double? DecidedMinutesAgo = null,
        bool ApprovedAwaitingVerification = false,
        string? OrganizerEmail = null,
        double? SentBackHoursAgo = null);

    public static readonly CommunitySeed[] Communities =
    [
        new("gta-azure-community", "GTA Azure Community", "GA", "Mississauga", 2140, Topics.Azure | Topics.AI, "Monthly Azure talks and an annual data & AI day, run by local MVPs since 2019."),
        new("toronto-dotnet-user-group", "Toronto .NET User Group", "TN", "Toronto", 3480, Topics.DotNet, "The city's oldest .NET meetup. First Tuesday of the month, downtown, pizza after."),
        new("angular-toronto", "Angular Toronto", "AT", "Toronto", 1920, Topics.Angular, "Deep dives and lightning talks for Angular teams, hosted at MaRS."),
        new("react-toronto", "React Toronto", "RT", "Toronto", 4310, Topics.React, "React, Next.js and front-end performance talks from teams shipping in production."),
        new("aws-user-group-toronto", "AWS User Group Toronto", "AW", "Toronto", 2870, Topics.Aws | Topics.AI, "Short talks from local teams building on AWS, plus re:Invent watch parties."),
        new("azure-toronto", "Azure Toronto", "AZ", "Toronto", 1260, Topics.Azure, "Infrastructure-as-code, governance and platform engineering on Azure."),
        new("ai-builders-gta", "AI Builders GTA", "AI", "Markham", 1780, Topics.AI, "Hands-on nights and hackathons for people building with open and hosted models."),
        new("women-in-ai-toronto", "Women in AI Toronto", "WA", "Toronto", 2050, Topics.AI, "Workshops, mentorship and talks led by women working in AI and data."),
        new("brampton-dev-night", "Brampton Dev Night", "BD", "Brampton", 640, Topics.DotNet | Topics.Angular, "A friendly monthly dev night in the Brampton Innovation District."),
        new("microsoft-reactor", "Microsoft Reactor", "MR", "Streaming", 18400, Topics.AI | Topics.Azure, "Global livestreams from Microsoft product teams and cloud advocates."),
        new("dotnet-conf-community", ".NET Conf Community", "NC", "Streaming", 9200, Topics.DotNet | Topics.Azure, "Community livestreams from the .NET Conf organizers."),
        new("ng-conf", "ng-conf", "NG", "Streaming", 7600, Topics.Angular, "The Angular conference, with live Q&A sessions through the year."),
        new("semantic-kernel-team", "Microsoft Semantic Kernel team", "SK", "Streaming", 5100, Topics.AI | Topics.DotNet, "Office hours and livestreams from the Semantic Kernel product team."),
        new("react-summit", "React Summit", "RS", "Streaming", 12800, Topics.React, "The global React conference, with remote tracks streamed from Amsterdam."),
        new("toronto-rust-meetup", "Toronto Rust Meetup", "TR", "Toronto", 980, Topics.None, "Monthly talks for Rust developers in Toronto."),
        new("cloud-native-toronto", "Cloud Native Toronto", "CN", "Toronto", 1540, Topics.Aws | Topics.Azure, "Kubernetes and cloud native talks for GTA teams."),
        new("crypto-wealth-academy", "WealthFast Academy", "WA", "Toronto", 0, Topics.None, "Unverified submitter."),
    ];

    public static readonly SpeakerSeed[] Speakers =
    [
        new("priya-natarajan", "Priya Natarajan", "PN", "Azure MVP · Cloud architect, Rogers", "Rogers", Topics.Azure | Topics.AI, "Mississauga"),
        new("marcus-bell", "Marcus Bell", "MB", "Data platform lead, Scotiabank", "Scotiabank", Topics.Azure | Topics.AI, "Toronto"),
        new("aisha-rahman", "Aisha Rahman", "AR", "Senior PM, Microsoft Fabric", "Microsoft", Topics.Azure | Topics.AI, "Redmond"),
        new("kenji-watanabe", "Kenji Watanabe", "KW", "Solutions architect, Shopify", "Shopify", Topics.Aws | Topics.React, "Toronto"),
        new("sofia-marchetti", "Sofia Marchetti", "SM", "Cloud advocate, Microsoft", "Microsoft", Topics.AI | Topics.Azure, "Toronto"),
        new("daniel-okafor", "Daniel Okafor", "DO", "Principal PM, Azure AI Foundry", "Microsoft", Topics.AI, "Redmond"),
        new("leila-haddad", "Leila Haddad", "LH", "Staff engineer, Wealthsimple", "Wealthsimple", Topics.Angular, "Toronto"),
        new("tomas-rivera", "Tomás Rivera", "TR", "Frontend lead, Ada Support", "Ada Support", Topics.React, "Toronto"),
        new("nadia-chen", "Nadia Chen", "NC", "ML engineer, Cohere", "Cohere", Topics.AI, "Toronto"),
    ];

    private static readonly VenueSeed MicrosoftCanada = new("Microsoft Canada", "81 Bay St", "Toronto", 43.6440, -79.3770);
    private static readonly VenueSeed Mars = new("MaRS Discovery District", "101 College St", "Toronto", 43.6598, -79.3881);
    private static readonly VenueSeed LivingArts = new("Living Arts Centre", "4141 Living Arts Dr", "Mississauga", 43.5912, -79.6441);
    private static readonly VenueSeed Bremner = new("120 Bremner Blvd", "120 Bremner Blvd", "Toronto", 43.6418, -79.3818);
    private static readonly VenueSeed VentureLab = new("ventureLAB", "3600 Steeles Ave E", "Markham", 43.8480, -79.3370);
    private static readonly VenueSeed Csi = new("Centre for Social Innovation", "192 Spadina Ave", "Toronto", 43.6488, -79.3963);
    private static readonly VenueSeed Vector = new("Vector Institute", "661 University Ave", "Toronto", 43.6596, -79.3889);
    private static readonly VenueSeed Spaces = new("Spaces", "1 University Ave", "Toronto", 43.6455, -79.3790);
    private static readonly VenueSeed Shopify = new("Shopify", "620 King St W", "Toronto", 43.6446, -79.4006);
    private static readonly VenueSeed WealthFast = new("WealthFast Academy", null, "Toronto", 43.6532, -79.3832);
    private static readonly VenueSeed Brampton = new("Brampton Innovation District", "8 Nelson St W", "Brampton", 43.6858, -79.7599);

    public static readonly EventSeed[] Events =
    [
        new("whats-new-in-dotnet-11-previews", "What's new in the .NET 11 previews", "toronto-dotnet-user-group", "A walkthrough of runtime, C# and ASP.NET Core changes, with live demos and pizza after.", Topics.DotNet, EventFormat.InPerson, "2026-11-03", "18:00", "20:30", MicrosoftCanada, null, 0, 142),
        new("azure-ai-foundry-shipping-agents", "Azure AI Foundry: shipping agents to production", "microsoft-reactor", "Evaluation, tracing and safe rollout patterns for agentic apps on Azure.", Topics.AI | Topics.Azure, EventFormat.Streaming, "2026-11-04", "12:00", "13:30", null, "America/Los_Angeles", 0, 2310,
            Speakers: [("sofia-marchetti", "Shipping agents safely"), ("daniel-okafor", "What's next in Foundry")],
            Details: e =>
            {
                e.Description = "Evaluation, tracing and safe rollout patterns for agentic apps on Azure. Live demos of the Foundry evaluation SDK, tracing with OpenTelemetry and staged rollouts with feature flags.\n\nQuestions are taken in the chat; the session is recorded and posted on Microsoft Learn within a day.";
                e.LivestreamNote = "YouTube and Microsoft Learn; the link opens 15 minutes before start";
            }),
        new("signals-all-the-way-down", "Signals all the way down", "angular-toronto", "Migrating a large app from RxJS-heavy state to signals, and what broke along the way.", Topics.Angular, EventFormat.InPerson, "2026-11-04", "18:30", "21:00", Mars, null, 0, 87,
            Speakers: [("leila-haddad", "Signals all the way down")]),
        new("azure-data-ai-day-gta", "Azure Data & AI Day GTA", "gta-azure-community", "A full day of Fabric, Azure OpenAI and data platform sessions from local MVPs, with a hands-on lab track.", Topics.Azure | Topics.AI, EventFormat.Hybrid, "2026-11-05", "09:00", "17:00", LivingArts, null, 4900, 318, Featured: true, SubmitterEmail: OrganizerEmail,
            Speakers: [("priya-natarajan", "Keynote: Fabric one year later"), ("marcus-bell", "Panel: data teams in Canadian banks"), ("aisha-rahman", "Grounding Azure OpenAI on your lakehouse"), ("kenji-watanabe", "Panel: data teams in Canadian banks")],
            Details: e =>
            {
                e.Description = "A full day of Fabric, Azure OpenAI and data platform sessions from local MVPs, with a hands-on lab track. Bring a laptop with an Azure subscription for the labs; trial credits are available at the door.\n\n- Two tracks: talks on the main stage, labs in Hall B\n- Lunch and coffee included; vegetarian, vegan and halal options\n- Step-free access from the Square One transit terminal";
                e.PriceNote = "includes lunch";
                e.PriceDetail = "Student tickets $15 with a valid ID";
                e.LivestreamNote = "Keynote and main-stage sessions; labs are in person only";
                e.Capacity = 400;
                e.Venue!.TravelNotes = "Step-free access from the Square One transit terminal";
                e.AgendaItems =
                [
                    new() { Order = 0, StartsAtLocal = new TimeOnly(9, 0), Title = "Registration and coffee" },
                    new() { Order = 1, StartsAtLocal = new TimeOnly(9, 30), Title = "Keynote: Fabric one year later — Priya Natarajan" },
                    new() { Order = 2, StartsAtLocal = new TimeOnly(11, 0), Title = "Grounding Azure OpenAI on your lakehouse — Aisha Rahman" },
                    new() { Order = 3, StartsAtLocal = new TimeOnly(12, 30), Title = "Lunch" },
                    new() { Order = 4, StartsAtLocal = new TimeOnly(13, 30), Title = "Lab: build a real-time dashboard with Eventstream" },
                    new() { Order = 5, StartsAtLocal = new TimeOnly(16, 15), Title = "Panel: data teams in Canadian banks — Marcus Bell, Kenji Watanabe" },
                ];
            }),
        new("bedrock-in-the-real-world", "Bedrock in the real world", "aws-user-group-toronto", "Three short talks from local teams running generative AI workloads on AWS.", Topics.Aws | Topics.AI, EventFormat.InPerson, "2026-11-05", "18:00", "20:30", Bremner, null, 0, 128),
        new("dotnet-aspire-deep-dive", ".NET Aspire deep dive", "dotnet-conf-community", "Orchestration, service defaults and deploying Aspire apps to Azure Container Apps.", Topics.DotNet | Topics.Azure, EventFormat.Streaming, "2026-11-06", "11:00", "12:30", null, "Europe/London", 0, 1480),
        new("gta-ai-builders-hackathon", "GTA AI Builders Hackathon", "ai-builders-gta", "Build with open models in 10 hours. Teams of up to four, mentors on site.", Topics.AI, EventFormat.InPerson, "2026-11-07", "10:00", "20:00", VentureLab, null, 0, 164),
        new("server-components-one-year-in", "Server Components, one year in", "react-toronto", "Lessons from teams that moved production apps to server components.", Topics.React, EventFormat.InPerson, "2026-11-09", "18:30", "21:00", Csi, null, 0, 112,
            Speakers: [("tomas-rivera", "Server Components, one year in")]),
        new("angular-roadmap-live-qa", "Angular roadmap: live Q&A with the team", "ng-conf", "The Angular team answers questions on zoneless, SSR and what is next.", Topics.Angular, EventFormat.Streaming, "2026-11-10", "13:00", "14:00", null, "America/Denver", 0, 940),
        new("rag-evaluation-workshop", "RAG evaluation workshop", "women-in-ai-toronto", "Hands-on: build an eval harness for a retrieval app and compare grounding metrics.", Topics.AI, EventFormat.InPerson, "2026-11-10", "18:00", "20:30", Vector, null, 1500, 60,
            Speakers: [("nadia-chen", "RAG evaluation workshop")]),
        new("landing-zones-that-dont-hurt", "Landing zones that don't hurt", "azure-toronto", "Practical Bicep and policy patterns for teams setting up their first enterprise subscription.", Topics.Azure, EventFormat.Hybrid, "2026-11-11", "19:00", "21:00", Spaces, null, 0, 103),
        new("semantic-kernel-office-hours", "Semantic Kernel office hours", "semantic-kernel-team", "Bring your agent and plugin questions for the product team.", Topics.AI | Topics.DotNet, EventFormat.Streaming, "2026-11-12", "12:00", "13:00", null, "America/Los_Angeles", 0, 620),
        new("blazor-vs-angular-friendly-fight", "Blazor vs Angular: a friendly fight", "brampton-dev-night", "Two teams build the same app live. The audience picks a winner.", Topics.DotNet | Topics.Angular, EventFormat.InPerson, "2026-11-12", "18:30", "21:00", Brampton, null, 0, 74),
        new("react-summit-remote-performance-track", "React Summit Remote: performance track", "react-summit", "Rendering, bundling and profiling talks from the global React community.", Topics.React, EventFormat.Streaming, "2026-11-13", "11:00", "15:00", null, "Europe/Amsterdam", 0, 3200),

        // Later in November: the month calendar and community pages show these.
        new("vector-search-in-postgres", "Vector search in Postgres", "ai-builders-gta", "Indexing embeddings in Postgres with pgvector, from schema to query plans.", Topics.AI, EventFormat.InPerson, "2026-11-17", "18:30", "20:30", VentureLab, null, 0, 58, ReviewHours: 3, DecidedMinutesAgo: 12),
        new("fabric-for-power-bi-developers", "Fabric for Power BI developers", "gta-azure-community", "Moving Power BI reports onto Fabric semantic models, with a live migration.", Topics.Azure | Topics.AI, EventFormat.Hybrid, "2026-11-18", "18:30", "20:30", MicrosoftCanada, null, 0, 0, EventStatus.InReview, SubmitterEmail: OrganizerEmail, SubmittedHoursAgo: 22),
        new("angular-toronto-lightning-talks", "Angular Toronto: lightning talks", "angular-toronto", "Five-minute talks from the community. Bring a demo.", Topics.Angular, EventFormat.InPerson, "2026-11-19", "18:30", "21:00", Mars, null, 0, 66),
        new("minimal-apis-in-practice", "Minimal APIs in practice", "toronto-dotnet-user-group", "Structuring, testing and versioning minimal API projects that grow.", Topics.DotNet, EventFormat.InPerson, "2026-11-19", "18:00", "20:30", MicrosoftCanada, null, 0, 97),
        new("reinvent-keynote-watch-party", "re:Invent keynote watch party", "aws-user-group-toronto", "Watch the keynote together, then talk through the launches.", Topics.Aws, EventFormat.InPerson, "2026-11-24", "11:00", "13:30", Bremner, null, 0, 45),
        new("testing-react-in-2027", "Testing React in 2027", "react-toronto", "What a modern React testing stack looks like, from components to end to end.", Topics.React, EventFormat.InPerson, "2026-11-26", "18:30", "21:00", Csi, null, 0, 81),

        // A past event and a cancelled one, for the event detail states (journey 02).
        new("minimal-apis-in-practice-october", "Minimal APIs in practice", "toronto-dotnet-user-group", "Structuring, testing and versioning minimal API projects that grow.", Topics.DotNet, EventFormat.InPerson, "2026-10-20", "18:00", "20:30", MicrosoftCanada, null, 0, 140,
            Details: e =>
            {
                e.AttendedCount = 131;
                e.RecordingUrl = "https://www.youtube.com/watch?v=sixstack-minimal-apis";
                e.SlidesUrl = "https://github.com/torontodotnet/minimal-apis-in-practice";
            }),
        new("brampton-dev-night-november-social", "Brampton Dev Night: November social", "brampton-dev-night", "Lightning demos and a friendly Q&A for .NET and Angular developers in Peel.", Topics.DotNet | Topics.Angular, EventFormat.InPerson, "2026-11-19", "18:30", "21:00", Brampton, null, 0, 52,
            Details: e =>
            {
                e.CancelledAtUtc = new DateTimeOffset(2026, 11, 1, 15, 0, 0, TimeSpan.Zero);
                e.CancellationReason = "Our venue had a scheduling conflict. We're rebooking for January and will post the new date here.";
            }),

        // Pending submissions in the review queue, as in docs/mocks/pages/review-queue (oldest first).
        new("rust-in-production-at-scale", "Rust in production at scale", "toronto-rust-meetup", "Three teams on running Rust services in production.", Topics.None, EventFormat.InPerson, "2026-11-17", "18:30", "20:30", Shopify, null, 0, 0, EventStatus.InReview, SubmitterEmail: "organizers@torontorust.ca", SubmittedHoursAgo: 2),
        new("kubernetes-on-a-budget", "Kubernetes on a budget", "cloud-native-toronto", "Running small clusters cheaply on any cloud.", Topics.Aws | Topics.Azure, EventFormat.Streaming, "2026-11-19", "18:00", "20:00", null, null, 0, 0, EventStatus.InReview, SubmitterEmail: "hello@cloudnativeto.ca", SubmittedHoursAgo: 5),
        new("free-crypto-trading-masterclass", "Free crypto trading masterclass", "crypto-wealth-academy", "Learn the secrets of 10x returns. Limited seats, register now!", Topics.None, EventFormat.InPerson, "2026-11-14", "14:00", "16:00", WealthFast, null, 0, 0, EventStatus.InReview, SubmitterEmail: "promo@wealthfast.biz", SubmittedHoursAgo: 26),

        // The listing the Kubernetes submission duplicates (same community, same day); Compare opens it.
        new("cloud-native-toronto-november-meetup", "Cloud Native Toronto: November meetup", "cloud-native-toronto", "Lightning talks on platform engineering, then pizza.", Topics.Aws | Topics.Azure, EventFormat.InPerson, "2026-11-19", "19:00", "21:00", Spaces, null, 0, 0, SubmitterEmail: "events@cloudnativeto.ca"),

        // Sent back to Priya for a missing venue address (organizer dashboard, needs changes).
        new("azure-bicep-clinic", "Azure Bicep clinic", "gta-azure-community", "Bring your templates; we review them together.", Topics.Azure, EventFormat.InPerson, "2026-11-24", "18:00", "20:00", new VenueSeed("To be confirmed", null, "Toronto", 43.6532, -79.3832), null, 0, 0, EventStatus.NeedsChanges, SubmitterEmail: OrganizerEmail, SentBackHoursAgo: 72),

        // Past events that give senders an approval history and the queue its median review time (3 h).
        new("service-meshes-without-tears", "Service meshes without tears", "cloud-native-toronto", "What a mesh buys you, and what it costs.", Topics.Aws | Topics.Azure, EventFormat.InPerson, "2026-10-12", "18:30", "20:30", Spaces, null, 0, 64, SubmitterEmail: "hello@cloudnativeto.ca", ReviewHours: 1),
        new("gitops-with-flux", "GitOps with Flux", "cloud-native-toronto", "Shipping to Kubernetes from a pull request.", Topics.Aws | Topics.Azure, EventFormat.InPerson, "2026-10-15", "18:30", "20:30", Spaces, null, 0, 71, SubmitterEmail: "hello@cloudnativeto.ca", ReviewHours: 3),
        new("cost-aware-autoscaling", "Cost-aware autoscaling", "cloud-native-toronto", "Scaling clusters on price as well as load.", Topics.Aws, EventFormat.InPerson, "2026-10-22", "18:30", "20:30", Spaces, null, 0, 58, SubmitterEmail: "hello@cloudnativeto.ca", ReviewHours: 3),
        new("cloud-native-toronto-october-meetup", "Cloud Native Toronto: October meetup", "cloud-native-toronto", "Platform teams compare notes.", Topics.Aws | Topics.Azure, EventFormat.InPerson, "2026-10-27", "18:30", "20:30", Spaces, null, 0, 66, SubmitterEmail: "hello@cloudnativeto.ca", ReviewHours: 5),
        new("azure-functions-deep-dive", "Azure Functions deep dive", "gta-azure-community", "Isolated workers, Flex Consumption and cold starts.", Topics.Azure, EventFormat.InPerson, "2026-10-13", "18:30", "20:30", MicrosoftCanada, null, 0, 88, SubmitterEmail: OrganizerEmail, ReviewHours: 2),
        new("bicep-for-app-developers", "Bicep for app developers", "gta-azure-community", "Infrastructure as code without the YAML.", Topics.Azure, EventFormat.InPerson, "2026-10-19", "18:30", "20:30", MicrosoftCanada, null, 0, 74, SubmitterEmail: OrganizerEmail, ReviewHours: 3),
        new("azure-ai-search-hands-on", "Azure AI Search hands-on", "gta-azure-community", "Hybrid retrieval for your own data.", Topics.Azure | Topics.AI, EventFormat.InPerson, "2026-10-26", "18:30", "20:30", MicrosoftCanada, null, 0, 95, SubmitterEmail: OrganizerEmail, ReviewHours: 3),
        new("copilot-studio-for-developers", "Copilot Studio for developers", "gta-azure-community", "Extending agents with your own APIs.", Topics.Azure | Topics.AI, EventFormat.InPerson, "2026-10-29", "18:30", "20:30", MicrosoftCanada, null, 0, 81, SubmitterEmail: OrganizerEmail, ReviewHours: 6),
    ];

    public const string OrganizerEmail = "priya@gtaazure.ca";
    public const string ModeratorEmail = "jordan@6ixstack.dev";
    public const string SecondModeratorEmail = "sam@6ixstack.dev";

    /// <summary>Senders who already proved their address, so their approved events publish straight away (L2-085).</summary>
    public static readonly string[] VerifiedSenders = [OrganizerEmail, "hello@cloudnativeto.ca", "organizers@torontorust.ca", "events@cloudnativeto.ca"];
}
