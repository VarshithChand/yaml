using SecurityAPI.Models;
using SecurityAPI.Services;

using Microsoft.AspNetCore.Mvc;

namespace SecurityAPI.Controllers;

[ApiController]
[Route("api/api-keys")]
public class ApiKeysController : ControllerBase
{
    private readonly ApiKeyStore _keys;

    public ApiKeysController(ApiKeyStore keys)
    {
        _keys = keys;
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_keys.GetAll());
    }

    // Returns the raw key exactly once — see ApiKeyStore.Create.
    [HttpPost]
    public IActionResult Create(CreateApiKeyRequest request)
    {
        return Ok(_keys.Create(request));
    }

    [HttpDelete("{id}")]
    public IActionResult Revoke(int id)
    {
        return _keys.Revoke(id) ? NoContent() : NotFound();
    }
}
