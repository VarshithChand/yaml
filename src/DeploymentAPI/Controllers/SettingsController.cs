using DeploymentAPI.DTOs;
using DeploymentAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeploymentAPI.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly SettingsService _settings;
    private readonly GitHubApiService _github;

    public SettingsController(SettingsService settings, GitHubApiService github)
    {
        _settings = settings;
        _github = github;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        return Ok(await _settings.GetViewAsync());
    }

    [HttpGet("github/preview")]
    public async Task<IActionResult> PreviewGitHub([FromQuery] string owner, [FromQuery] string repository)
    {
        if (string.IsNullOrWhiteSpace(owner) || string.IsNullOrWhiteSpace(repository))
            return BadRequest("owner and repository are required.");

        return Ok(await _github.PreviewRepositoryAsync(owner, repository));
    }

    [HttpPost("github")]
    public async Task<IActionResult> SaveGitHub(GitHubSettingsUpdateDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        return Ok(await _settings.SaveGitHubAsync(request));
    }

    [HttpPost("docker")]
    public async Task<IActionResult> SaveDocker(DockerSettingsUpdateDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        return Ok(await _settings.SaveDockerAsync(request));
    }

    [HttpPost("github-oauth")]
    public async Task<IActionResult> SaveGitHubOAuth(GitHubOAuthUpdateDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        return Ok(await _settings.SaveGitHubOAuthAsync(request));
    }

    [HttpPost("admins")]
    public async Task<IActionResult> SaveAdmins(AdminUsernamesUpdateDto request)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        return Ok(await _settings.SaveAdminUsernamesAsync(request));
    }

    [HttpDelete("{section}")]
    public async Task<IActionResult> Clear(string section)
    {
        if (await DenyUnlessAdminAsync() is IActionResult denied)
            return denied;

        try
        {
            return Ok(await _settings.ClearAsync(section));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // Changing credentials or the admin allowlist is restricted to admins —
    // without this, any anonymous visitor could overwrite the GitHub PAT,
    // point the OAuth app at their own client, or add their own GitHub
    // username to the admin list. The one exception is a fresh, unconfigured
    // instance (no admin designated yet): the first person to visit Settings
    // has to be able to configure it without a login that, before any admin
    // exists, nobody could have obtained.
    private async Task<IActionResult?> DenyUnlessAdminAsync()
    {
        var view = await _settings.GetViewAsync();

        if (view.AdminGitHubUsernames.Count == 0)
            return null;

        if (User.Identity?.IsAuthenticated == true && User.IsInRole("Admin"))
            return null;

        return StatusCode(403, new { message = "Admin login required to change settings." });
    }
}
