namespace DeploymentAPI.DTOs;

public class InviteCollaboratorUpdateDto
{
    // One of GitHub's five collaborator permission levels: pull, triage,
    // push, maintain, admin (least to most access).
    public string Permission { get; set; } = "push";
}
