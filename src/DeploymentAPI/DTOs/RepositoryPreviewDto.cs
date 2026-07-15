namespace DeploymentAPI.DTOs;

public class RepositoryPreviewDto
{
    public bool Found { get; set; }

    public string? Error { get; set; }

    public string Owner { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string DefaultBranch { get; set; } = string.Empty;

    public bool Private { get; set; }

    public int Stars { get; set; }

    public int BranchCount { get; set; }

    public bool BranchCountApproximate { get; set; }

    public int WorkflowCount { get; set; }

    public string HtmlUrl { get; set; } = string.Empty;
}
