using DeploymentAPI.DTOs;
using DeploymentAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeploymentAPI.Helpers;

// Shared by every controller action that mutates real GitHub state or
// portal settings. Previously copy-pasted as a private DenyUnlessAdminAsync
// method into three controllers (Settings, Access, PullRequests) — and
// three other mutating actions (triggering a deployment, approving/
// rejecting a release, deleting an artifact) had no gate applied at all,
// since there was no shared, easy-to-reach-for mechanism prompting it.
//
// Rule: an empty admin allowlist means the portal hasn't been configured
// yet ("bootstrap mode") — anyone can act, since before any admin exists
// nobody could have logged in as one. Once the list is non-empty, only an
// authenticated user in the "Admin" role may act.
public static class AdminGate
{
    public static bool IsAdminOrBootstrap(ControllerBase controller, SettingsViewDto view) =>
        view.AdminGitHubUsernames.Count == 0
        || (controller.User.Identity?.IsAuthenticated == true && controller.User.IsInRole("Admin"));

    public static async Task<IActionResult?> DenyUnlessAdminAsync(ControllerBase controller, SettingsService settings, string action)
    {
        var view = await settings.GetViewAsync();

        if (IsAdminOrBootstrap(controller, view))
            return null;

        return controller.StatusCode(403, new { message = $"Admin login required to {action}." });
    }
}
