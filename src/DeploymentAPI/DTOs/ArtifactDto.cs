namespace DeploymentAPI.DTOs;

public class ArtifactDto
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public long Size { get; set; }

    public bool Expired { get; set; }

    public DateTime CreatedAt { get; set; }

    public string DownloadUrl { get; set; } = string.Empty;

    public string Branch { get; set; } = string.Empty;

    public string CommitSha { get; set; } = string.Empty;

    public string CommitMessage { get; set; } = string.Empty;

    public string WorkflowRunUrl { get; set; } = string.Empty;
}