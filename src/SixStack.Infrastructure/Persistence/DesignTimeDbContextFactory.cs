using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SixStack.Infrastructure.Persistence;

/// <summary>Lets <c>dotnet ef migrations add</c> build the SQL Server model without a running API.</summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=SixStack;Trusted_Connection=True")
            .Options;
        return new AppDbContext(options);
    }
}
