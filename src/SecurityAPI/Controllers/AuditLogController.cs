using SecurityAPI.Models;
using SecurityAPI.Services;

using Microsoft.AspNetCore.Mvc;

namespace SecurityAPI.Controllers;

[ApiController]
[Route("api/audit-logs")]
public class AuditLogController : ControllerBase
{
    private readonly AuditLogStore _logs;

    public AuditLogController(AuditLogStore logs)
    {
        _logs = logs;
    }

    [HttpGet]
    public IActionResult GetRecent([FromQuery] int limit = 200)
    {
        return Ok(_logs.GetRecent(limit));
    }

    [HttpPost]
    public IActionResult Create(CreateAuditLogRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Action))
            return BadRequest(new { message = "An action is required." });

        return Ok(_logs.Add(request));
    }
}
