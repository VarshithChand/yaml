namespace DeploymentAPI.DTOs;

public class CreateDockerContainerDto
{
    public string Image { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    // "8080:80" host:container pairs.
    public List<string> Ports { get; set; } = new();

    // "KEY=VALUE" pairs.
    public List<string> Env { get; set; } = new();

    // "volume-name-or-host-path:/container/path" pairs.
    public List<string> Volumes { get; set; } = new();

    public string? Network { get; set; }

    public bool RestartUnlessStopped { get; set; } = true;
}
