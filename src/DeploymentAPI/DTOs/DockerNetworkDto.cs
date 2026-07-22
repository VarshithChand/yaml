namespace DeploymentAPI.DTOs;

public class DockerNetworkDto
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Driver { get; set; } = string.Empty;

    public string Scope { get; set; } = string.Empty;
}
