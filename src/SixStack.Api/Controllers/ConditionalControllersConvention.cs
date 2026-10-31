using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace SixStack.Api.Controllers;

/// <summary>Removes development-only controllers unless their setting enables them.</summary>
public sealed class ConditionalControllersConvention(bool testSignIn, bool devMailbox) : IApplicationModelConvention
{
    public void Apply(ApplicationModel application)
    {
        foreach (var controller in application.Controllers.ToList())
        {
            if ((controller.ControllerType == typeof(TestSignInController) && !testSignIn)
                || (controller.ControllerType == typeof(DevMailboxController) && !devMailbox))
            {
                application.Controllers.Remove(controller);
            }
        }
    }
}
