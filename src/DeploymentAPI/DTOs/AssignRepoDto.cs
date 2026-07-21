namespace DeploymentAPI.DTOs;

public class AssignRepoDto
{
    public string Owner { get; set; } = string.Empty;

    public string Repository { get; set; } = string.Empty;

    public string Permission { get; set; } = "push";
}
