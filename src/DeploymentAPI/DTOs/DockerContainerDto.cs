namespace DeploymentAPI.DTOs;

// The Docker Engine management page's container row — distinct from
// DockerImageDto/DockerSettingsUpdateDto, which describe the unrelated
// "Docker Registry" credentials feature in Settings.
public class DockerContainerDto
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Image { get; set; } = string.Empty;

    // Docker's own short state, e.g. "running", "exited", "created".
    public string State { get; set; } = string.Empty;

    // Docker's human-readable status, e.g. "Up 2 hours", "Exited (0) 5 minutes ago".
    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public List<string> Ports { get; set; } = new();
}
