namespace DeploymentAPI.DTOs;

public class DockerVolumeDto
{
    public string Name { get; set; } = string.Empty;

    public string Driver { get; set; } = string.Empty;

    public string Mountpoint { get; set; } = string.Empty;

    public DateTime? CreatedAt { get; set; }
}
