using Microsoft.AspNetCore.Mvc;

namespace AdminAPI.Controllers;

// Fixed set, not stored/editable — this sample app doesn't need custom
// roles, just enough for UsersController's Role field to mean something.
[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    private static readonly string[] Roles = { "Admin", "Manager", "Viewer" };

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(Roles);
    }
}
