namespace SixStack.Cli;

/// <summary>The <c>--help</c> text of the <c>events</c> commands (L2-114, event-admin-cli design).</summary>
public static class EventsHelp
{
    private const string WriteOptions = """
          --actor <email>        Moderator account making the change; or set SIXSTACK_ACTOR. Required.
          --yes                  Apply without asking.
          --dry-run              Validate and show the change; write nothing.
          --json                 Print one JSON document.
        Without --yes or --dry-run, a terminal is asked "Apply? [y/N]"; anything else writes nothing (exit 6).
        """;

    private const string FieldOptions = """
          --file <event.json>    JSON object of the form fields events get --json prints (title to ticketUrl);
                         any other property is a usage error.
          --title, --organizer, --description, --topics <ai,dotnet,azure,angular,react,aws>,
          --date <yyyy-MM-dd>, --start <HH:mm>, --end <HH:mm>, --time-zone <IANA id>,
          --format <inPerson|streaming|hybrid>, --venue, --city, --address, --stream-url,
          --ticket-url, --price <cad, 0 for free>
                                 Field flags; they win over --file. An empty value clears an optional field.
        """;

    public static readonly string Overview = $"""
        sixstack events <list|get|add|update|delete> [options]

          events list            List events (every status but deleted unless --status is given).
          events get             Show one event by id or slug.
          events add             Add an event, published at once.
          events update          Change an event's fields.
          events delete          Soft-delete an event (its status becomes deleted).

        Run sixstack events <command> --help for its options. Every command takes --json.
        Writes need --actor <email> (or SIXSTACK_ACTOR) and --yes or --dry-run.

        Exit codes: 0 success, 1 usage error, 2 validation error, 3 not found, 4 conflict,
                    5 actor missing or not a moderator, 6 not confirmed, 10 unexpected error.
        """;

    public static readonly IReadOnlyDictionary<string, string> Commands = new Dictionary<string, string>
    {
        ["list"] = """
            sixstack events list [options]

              --status <status>      draft, inReview, published, rejected, deleted or needsChanges.
              --from <yyyy-MM-dd>    First Toronto date the event starts on.
              --to <yyyy-MM-dd>      Last Toronto date the event starts on.
              --search <text>        Text in the title or organizer, any case.
              --take <n>             At most n events, 1 to 500 (default 50).
              --json                 Print { "count", "events": [...] }.
            """,
        ["get"] = """
            sixstack events get <id-or-slug> [options]

              --show-contact         Include the submitter's email address.
              --json                 Print { "event": {...} }.
            """,
        ["add"] = $"""
            sixstack events add [--file <event.json>] [field flags] --actor <email> [--yes | --dry-run]

            {FieldOptions}
            {WriteOptions}
            """,
        ["update"] = $"""
            sixstack events update <id-or-slug> [--file <patch.json>] [field flags] --actor <email> [--yes | --dry-run]

              --if-version <version> Fail with exit 4 if the event changed since events get printed this version.
            {FieldOptions}
            {WriteOptions}
            """,
        ["delete"] = $"""
            sixstack events delete <id-or-slug> --actor <email> [--yes | --dry-run]

              --if-version <version> Fail with exit 4 if the event changed since events get printed this version.
            {WriteOptions}
            """,
    };
}
