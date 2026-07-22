namespace DeploymentAPI.DTOs;

public class DockerEngineImageDto
{
    public string Id { get; set; } = string.Empty;

    public List<string> Tags { get; set; } = new();

    public long SizeBytes { get; set; }

    public DateTime CreatedAt { get; set; }
}
