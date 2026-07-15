namespace DeploymentAPI.DTOs;

public class DockerImageDto
{
    public string Name { get; set; } = string.Empty;

    public string Visibility { get; set; } = string.Empty;

    public int VersionCount { get; set; }

    public string Repository { get; set; } = string.Empty;

    public string HtmlUrl { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; }
}
