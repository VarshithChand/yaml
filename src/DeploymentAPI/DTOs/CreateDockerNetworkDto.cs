namespace DeploymentAPI.DTOs;

public class CreateDockerNetworkDto
{
    public string Name { get; set; } = string.Empty;

    public string Driver { get; set; } = "bridge";
}
