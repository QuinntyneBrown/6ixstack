using SixStack.Api.Auth;
using SixStack.Api.Controllers;
using SixStack.Api.Platform;
using SixStack.Application;
using SixStack.Infrastructure;
using SixStack.Infrastructure.Outbox;
using SixStack.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.AddJsonConsole(options => options.IncludeScopes = true);

var testSignInEnabled = builder.Configuration.GetValue<bool>("Auth:TestSignIn:Enabled");
builder.Services.AddControllers(options => options.Conventions.Add(new TestSignInConvention(testSignInEnabled)));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSixStackAuth();
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>(tags: ["ready"]);
if (builder.Configuration.GetValue("Outbox:Enabled", true))
{
    builder.Services.AddHostedService<OutboxProcessor>();
}

var app = builder.Build();

// Pipeline order is part of the design (platform/observability, platform/security-hardening).
// Request logging stays outside the exception handler so handled statuses are logged as returned.
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger is mapped before authentication so the document stays reachable without a session.
if (app.Configuration.GetValue("Swagger:Enabled", app.Environment.IsDevelopment()))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health/live", new() { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains("ready") }).AllowAnonymous();

app.Run();

public partial class Program;
