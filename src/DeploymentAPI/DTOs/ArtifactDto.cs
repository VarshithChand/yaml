namespace DeploymentAPI.DTOs;

public class ArtifactDto
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public long Size { get; set; }

    public bool Expired { get; set; }

    public DateTime CreatedAt { get; set; }

    public string DownloadUrl { get; set; } = string.Empty;
}