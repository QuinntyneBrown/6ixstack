namespace SixStack.Cli;

/// <summary>The <c>--help</c> text of the <c>tokens</c> commands (L2-124, event-admin-api design).</summary>
public static class TokensHelp
{
    private const string ActorOption = """
          --actor <email>        Moderator account whose tokens these are; or set SIXSTACK_ACTOR. Required.
        """;

    private const string WriteOptions = """
          --yes                  Apply without asking.
          --dry-run              Validate and show the change; write nothing.
          --json                 Print one JSON document.
        Without --yes or --dry-run, a terminal is asked "Apply? [y/N]"; anything else writes nothing (exit 6).
        """;

    public static readonly string Overview = """
        sixstack tokens <create|list|revoke> [options]

          tokens create          Issue a personal API token for the admin API; it is printed once.
          tokens list            List your tokens with their status; never the tokens themselves.
          tokens revoke          Revoke one of your tokens by id.

        Run sixstack tokens <command> --help for its options. Every command takes --json.
        Every command needs --actor <email> (or SIXSTACK_ACTOR), a moderator account.
        Send a token as "Authorization: Bearer <token>" to /api/admin/events.

        Exit codes: 0 success, 1 usage error, 2 validation error, 3 not found, 4 conflict,
                    5 actor missing or not a moderator, 6 not confirmed, 10 unexpected error.
        """;

    public static readonly IReadOnlyDictionary<string, string> Commands = new Dictionary<string, string>
    {
        ["create"] = $"""
            sixstack tokens create --name <name> [--days <n>] --actor <email> [--yes | --dry-run]

              --name <name>          What the token is for, such as laptop-agent (1 to 80 characters).
              --days <n>             Lifetime in days, 1 to 365 (default 90).
            {ActorOption}
            {WriteOptions}
            """,
        ["list"] = $"""
            sixstack tokens list --actor <email>

            {ActorOption}
              --json                 Print {"{"} "count", "tokens": [...] {"}"}.
            """,
        ["revoke"] = $"""
            sixstack tokens revoke <token-id> --actor <email> [--yes | --dry-run]

            {ActorOption}
            {WriteOptions}
            """,
    };
}
