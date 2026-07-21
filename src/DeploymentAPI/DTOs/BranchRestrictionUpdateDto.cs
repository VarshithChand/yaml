namespace DeploymentAPI.DTOs;

public class BranchRestrictionUpdateDto
{
    // GitHub logins allowed to push once this branch is restricted — only
    // takes effect on organization-owned repositories; GitHub rejects it
    // on a personal-account repository regardless of plan.
    public List<string> Usernames { get; set; } = new();
}
