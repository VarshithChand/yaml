namespace DeploymentAPI.Configuration;

public class DockerSettings
{
    public string Registry { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
