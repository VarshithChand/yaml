using PMSCoreAPI.Models;
using PMSCoreAPI.Services;

using Microsoft.AspNetCore.Mvc;

namespace PMSCoreAPI.Controllers;

// Standalone (not nested under /api/projects/{id}) since a task is looked
// up and edited by its own id once created — ProjectsController handles
// creating a task under a specific project.
[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ProjectStore _projects;

    public TasksController(ProjectStore projects)
    {
        _projects = projects;
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var task = _projects.GetTask(id);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, UpdateTaskRequest request)
    {
        var updated = _projects.UpdateTask(id, request);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        return _projects.RemoveTask(id) ? NoContent() : NotFound();
    }
}
