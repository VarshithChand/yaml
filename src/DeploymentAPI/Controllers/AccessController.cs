using DeploymentAPI.DTOs;
using DeploymentAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeploymentAPI.Controllers;

// Repository access management — invite/remove collaborators, assign
// permission levels, and note a branch's purpose or restrict who can
// push to it. Listing is open to any caller (same as GitHubController's
// branch/repo endpoints); every action that changes real GitHub state or
// the locally-stored branch notes is admin-gated.
[ApiController]
[Route("api/access")]
public class AccessController : ControllerBase
{
    private readonly GitHubApiService _github;
    private readonly SettingsService _settings;
    private readonly ActivityLogService _log;

    public AccessController(GitHubApiService github, SettingsService settings, ActivityLogService log)
    {
        _github = github;
        _settings = settings;
        _log = log;
    }

    // Active collaborators only — used by the Branches page's "restrict who
    // can push" picker, since a pending invite can't push yet regardless.
    [HttpGet("collaborators")]
    public async Task<IActionResult> Collaborators([FromQuery] bool force = false)
    {
        return Ok(await _github.GetCollaboratorsAsync(force));
    }

    // Active + pending combined — what the Access Levels page renders.
    [HttpGet("entries")]
    public async Task<IActionResult> Entries([FromQuery] bool force = false)
    {
        return Ok(await _github.GetAccessEntriesAsync(force));
    }

    // Invite page: creates a brand-new invitation. GitHub emails the
    // invitee automatically the moment this call succeeds — the portal
    // doesn't need its own notification step for that.
    [HttpPut("collaborators/{username}")]
    public async Task<IActionResult> InviteCollaborator(string username, InviteCollaboratorUpdateDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        var permission = string.IsNullOrWhiteSpace(request.Permission) ? "push" : request.Permission;

        await _github.InviteCollaboratorAsync(username, permission);

        _log.LogInfo("Access", $"Invited/updated collaborator '{username}' with '{permission}' access.");

        return Ok(await _github.GetAccessEntriesAsync(forceRefresh: true));
    }

    [HttpDelete("collaborators/{username}")]
    public async Task<IActionResult> RemoveCollaborator(string username)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        await _github.RemoveCollaboratorAsync(username);

        _log.LogInfo("Access", $"Removed collaborator '{username}'.");

        return Ok(await _github.GetAccessEntriesAsync(forceRefresh: true));
    }

    // Access Levels page: change a still-pending invitation's level.
    // GitHub also emails the invitee about this automatically.
    [HttpPut("invitations/{invitationId}")]
    public async Task<IActionResult> UpdateInvitation(long invitationId, InviteCollaboratorUpdateDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        var permission = string.IsNullOrWhiteSpace(request.Permission) ? "push" : request.Permission;

        await _github.UpdateInvitationAsync(invitationId, permission);

        _log.LogInfo("Access", $"Updated pending invitation {invitationId} to '{permission}' access.");

        return Ok(await _github.GetAccessEntriesAsync(forceRefresh: true));
    }

    [HttpDelete("invitations/{invitationId}")]
    public async Task<IActionResult> RemoveInvitation(long invitationId)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        await _github.RemoveInvitationAsync(invitationId);

        _log.LogInfo("Access", $"Cancelled pending invitation {invitationId}.");

        return Ok(await _github.GetAccessEntriesAsync(forceRefresh: true));
    }

    [HttpPost("branches")]
    public async Task<IActionResult> CreateBranch(CreateBranchDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.SourceBranch))
            return BadRequest(new { message = "A branch name and a source branch are both required." });

        await _github.CreateBranchAsync(request.Name.Trim(), request.SourceBranch);

        _log.LogInfo("Access", $"Created branch '{request.Name}' from '{request.SourceBranch}'.");

        return Ok(await _github.GetBranches(forceRefresh: true));
    }

    [HttpGet("branches")]
    public async Task<IActionResult> Branches([FromQuery] bool force = false)
    {
        var branches = await _github.GetBranches(force);
        var purposes = await _settings.GetBranchPurposesAsync();

        var result = new List<BranchAccessDto>();

        foreach (var branch in branches)
        {
            var (restricted, allowedUsers) = await _github.GetBranchRestrictionAsync(branch.Name, force);

            result.Add(new BranchAccessDto
            {
                Name = branch.Name,
                Purpose = purposes.TryGetValue(branch.Name, out var purpose) ? purpose : string.Empty,
                Restricted = restricted,
                AllowedUsers = allowedUsers
            });
        }

        return Ok(result);
    }

    [HttpPut("branches/{branch}/purpose")]
    public async Task<IActionResult> SaveBranchPurpose(string branch, BranchPurposeUpdateDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        await _settings.SaveBranchPurposeAsync(branch, request.Purpose ?? string.Empty);

        return Ok();
    }

    [HttpPut("branches/{branch}/restrictions")]
    public async Task<IActionResult> SetBranchRestriction(string branch, BranchRestrictionUpdateDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        if (request.Usernames == null || request.Usernames.Count == 0)
            return BadRequest(new { message = "Select at least one user to restrict pushes to." });

        await _github.SetBranchRestrictionAsync(branch, request.Usernames);

        _log.LogInfo("Access", $"Restricted pushes on '{branch}' to: {string.Join(", ", request.Usernames)}.");

        return Ok();
    }

    [HttpDelete("branches/{branch}/restrictions")]
    public async Task<IActionResult> RemoveBranchRestriction(string branch)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        await _github.RemoveBranchRestrictionAsync(branch);

        _log.LogInfo("Access", $"Removed push restriction on '{branch}'.");

        return Ok();
    }

    // Copied from SettingsController.DenyUnlessAdminAsync — the codebase
    // has no shared base controller/filter for admin-gating yet, so this
    // mirrors that method exactly rather than introducing a new shared
    // abstraction as a side effect of this feature.
    private async Task<IActionResult?> DenyUnlessAdminAsync()
    {
        var view = await _settings.GetViewAsync();

        if (view.AdminGitHubUsernames.Count == 0)
            return null;

        if (User.Identity?.IsAuthenticated == true && User.IsInRole("Admin"))
            return null;

        return StatusCode(403, new { message = "Admin login required to change repository access." });
    }
}
