using DeploymentAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeploymentAPI.Controllers;

[ApiController]
[Route("api/github")]
public class GitHubController : ControllerBase
{
    private readonly GitHubApiService _service;

    public GitHubController(GitHubApiService service)
    {
        _service = service;
    }

    [HttpGet("repository")]
    public async Task<IActionResult> Repository([FromQuery] bool force = false)
    {
        // GetRepository() returns GitHub's raw JSON as a string; Content()
        // writes it through as-is instead of Ok() re-encoding it as a JSON string literal.
        var json = await _service.GetRepository(force);
        return Content(json, "application/json");
    }

    [HttpGet("branches")]
    public async Task<IActionResult> Branches([FromQuery] bool force = false)
    {
        return Ok(await _service.GetBranches(force));
    }

    [HttpGet("rate-limit")]
    public async Task<IActionResult> RateLimit()
    {
        return Ok(await _service.GetRateLimitAsync());
    }

    [HttpGet("token-owner")]
    public async Task<IActionResult> TokenOwner()
    {
        return Ok(await _service.GetTokenOwnerAsync());
    }

    [HttpGet("account-repositories")]
    public async Task<IActionResult> AccountRepositories()
    {
        return Ok(await _service.GetAccountRepositoriesAsync());
    }

    [HttpGet("artifacts")]
    public async Task<IActionResult> Artifacts([FromQuery] bool force = false)
    {
        return Ok(await _service.GetArtifacts(force));
    }

    [HttpGet("docker-images")]
    public async Task<IActionResult> DockerImages()
    {
        return Ok(await _service.GetDockerImages());
    }

    [HttpGet("artifacts/{id}/download")]
    public async Task<IActionResult> DownloadArtifact(long id)
    {
        var (content, fileName) = await _service.DownloadArtifactAsync(id);
        return File(content, "application/zip", fileName);
    }

    [HttpDelete("artifacts/{id}")]
    public async Task<IActionResult> DeleteArtifact(long id)
    {
        await _service.DeleteArtifactAsync(id);
        return NoContent();
    }

    [HttpGet("workflows")]
    public async Task<IActionResult> Workflows([FromQuery] bool force = false)
    {
        var json = await _service.GetWorkflows(force);
        return Content(json, "application/json");
    }

    [HttpGet("workflow-inputs")]
    public async Task<IActionResult> WorkflowInputs([FromQuery] string path, [FromQuery] string? branch)
    {
        if (string.IsNullOrWhiteSpace(path))
            return BadRequest("path is required.");

        return Ok(await _service.GetWorkflowInputsAsync(path, branch));
    }

    [HttpGet("workflows/last-run")]
    public async Task<IActionResult> LastRun([FromQuery] string workflow, [FromQuery] string? branch)
    {
        if (string.IsNullOrWhiteSpace(workflow))
            return BadRequest("workflow is required.");

        return Ok(await _service.GetLatestRunSummaryAsync(workflow, branch));
    }
}