namespace SixStack.Infrastructure.Tests;

/// <summary>
/// A fact that needs a real SQL Server. Skipped unless <c>SIXSTACK_TEST_SQLSERVER</c> holds a connection
/// string (or "1" for LocalDB). Mark such tests with <c>[Trait("Category", "SqlServer")]</c>.
/// </summary>
public sealed class SqlServerFactAttribute : FactAttribute
{
    public const string Variable = "SIXSTACK_TEST_SQLSERVER";

    public SqlServerFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(Variable)))
        {
            Skip = $"Set {Variable} to run SQL Server tests.";
        }
    }

    public static string ConnectionString
    {
        get
        {
            var value = Environment.GetEnvironmentVariable(Variable)!;
            var baseConnection = value == "1" ? "Server=(localdb)\\mssqllocaldb;Trusted_Connection=True;TrustServerCertificate=True" : value;
            return $"{baseConnection.TrimEnd(';')};Database=SixStackTests_{Guid.NewGuid():N}";
        }
    }
}
