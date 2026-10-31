using SixStack.Api.Auth;
using SixStack.Api.Controllers;
using SixStack.Application;
using SixStack.Infrastructure;
using SixStack.Infrastructure.Outbox;

var builder = WebApplication.CreateBuilder(args);

var testSignInEnabled = builder.Configuration.GetValue<bool>("Auth:TestSignIn:Enabled");
builder.Services.AddControllers(options => options.Conventions.Add(new TestSignInConvention(testSignInEnabled)));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSixStackAuth();
if (builder.Configuration.GetValue("Outbox:Enabled", true))
{
    builder.Services.AddHostedService<OutboxProcessor>();
}

var app = builder.Build();

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

app.Run();

public partial class Program;
