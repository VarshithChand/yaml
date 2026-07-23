using Microsoft.AspNetCore.Mvc;

namespace PMSCoreAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            Service = "PMSCoreAPI",
            Status = "Running"
        });
    }
}