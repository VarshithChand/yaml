namespace DeploymentAPI.DTOs;

public class DeployResultDto
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public long? RunId { get; set; }
}
