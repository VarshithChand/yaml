namespace DeploymentAPI.DTOs;

public class DockerSettingsUpdateDto
{
    public string Registry { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    // Left blank/null keeps the previously saved password instead of clearing it.
    public string? Password { get; set; }
}
