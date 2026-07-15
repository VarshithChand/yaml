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
    public async Task<IActionResult> Repository()
    {
        // GetRepository() returns GitHub's raw JSON as a string; Content()
        // writes it through as-is instead of Ok() re-encoding it as a JSON string literal.
        var json = await _service.GetRepository();
        return Content(json, "application/json");
    }

    [HttpGet("branches")]
    public async Task<IActionResult> Branches()
    {
        return Ok(await _service.GetBranches());
    }

    [HttpGet("artifacts")]
    public async Task<IActionResult> Artifacts()
    {
        return Ok(await _service.GetArtifacts());
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

    [HttpGet("workflows")]
    public async Task<IActionResult> Workflows()
    {
        var json = await _service.GetWorkflows();
        return Content(json, "application/json");
    }

    [HttpGet("workflow-inputs")]
    public async Task<IActionResult> WorkflowInputs([FromQuery] string path, [FromQuery] string? branch)
    {
        if (string.IsNullOrWhiteSpace(path))
            return BadRequest("path is required.");

        return Ok(await _service.GetWorkflowInputsAsync(path, branch));
    }
}