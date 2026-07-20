namespace DeploymentAPI.DTOs;

public class LogEntryDto
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = "Info";
    public string Category { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
