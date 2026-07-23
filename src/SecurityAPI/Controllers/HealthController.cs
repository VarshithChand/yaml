using Microsoft.AspNetCore.Mvc;

namespace SecurityAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            Service = "SecurityAPI",
            Status = "Running"
        });
    }
}