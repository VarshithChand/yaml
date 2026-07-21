namespace DeploymentAPI.DTOs;

public class CreateBranchDto
{
    public string Name { get; set; } = string.Empty;

    public string SourceBranch { get; set; } = string.Empty;
}
