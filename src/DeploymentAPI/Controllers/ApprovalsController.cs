using DeploymentAPI.DTOs;
using DeploymentAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeploymentAPI.Controllers;

[ApiController]
[Route("api/approvals")]
public class ApprovalsController : ControllerBase
{
    private readonly GitHubApiService _service;

    public ApprovalsController(GitHubApiService service)
    {
        _service = service;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> Pending()
    {
        return Ok(await _service.GetPendingApprovalsAsync());
    }

    [HttpPost("decide")]
    public async Task<IActionResult> Decide(ApprovalDecisionDto decision)
    {
        if (decision.RunId <= 0 || decision.EnvironmentIds.Count == 0)
            return BadRequest("runId and at least one environmentId are required.");

        await _service.SubmitApprovalAsync(decision);
        return Ok();
    }

    [HttpGet("history")]
    public async Task<IActionResult> History()
    {
        return Ok(await _service.GetApprovalHistoryAsync());
    }
}
