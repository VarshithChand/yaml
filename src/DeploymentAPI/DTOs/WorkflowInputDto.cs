namespace DeploymentAPI.DTOs;

public class WorkflowInputDto
{
    public string Name { get; set; } = string.Empty;

    // "string" | "boolean" | "choice" | "environment" | "number"
    public string Type { get; set; } = "string";

    public bool Required { get; set; }

    public string? Default { get; set; }

    public string? Description { get; set; }

    public List<string>? Options { get; set; }
}
