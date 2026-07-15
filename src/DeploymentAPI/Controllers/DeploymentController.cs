using DeploymentAPI.DTOs;
using DeploymentAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeploymentAPI.Controllers;

[ApiController]
[Route("api/deployment")]
public class DeploymentController : ControllerBase
{
    private readonly DeploymentService _service;

    public DeploymentController(
        DeploymentService service)
    {
        _service = service;
    }

    [HttpPost("deploy")]
    public async Task<IActionResult> Deploy(
        DeployDto request)
    {
        var result =
            await _service.DeployAsync(request);

        return Ok(result);
    }
}