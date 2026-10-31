using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace SixStack.Api.Controllers;

/// <summary>Removes <see cref="TestSignInController"/> unless the test sign-in seam is enabled.</summary>
public sealed class TestSignInConvention(bool enabled) : IApplicationModelConvention
{
    public void Apply(ApplicationModel application)
    {
        if (enabled)
        {
            return;
        }

        foreach (var controller in application.Controllers.Where(c => c.ControllerType == typeof(TestSignInController)).ToList())
        {
            application.Controllers.Remove(controller);
        }
    }
}
