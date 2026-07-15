namespace DeploymentAPI.DTOs;

public class DeployDto
{
    // "CI" or "CD" — CI just runs the workflow on a branch (no inputs). CD
    // sends whatever workflow_dispatch inputs that specific workflow declares
    // (fetched from its YAML) — the keys and meaning vary per workflow, so
    // this is a free-form map rather than fixed fields.
    public string Mode { get; set; } = "CD";

    public string Branch { get; set; } = "";

    public string Workflow { get; set; } = "";

    public Dictionary<string, string> Inputs { get; set; } = new();
}
