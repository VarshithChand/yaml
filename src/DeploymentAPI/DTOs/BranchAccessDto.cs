namespace DeploymentAPI.DTOs;

public class BranchAccessDto
{
    public string Name { get; set; } = string.Empty;

    // Free-text note stored locally (not a GitHub concept) — e.g. "release
    // branch, do not delete" — so branches carry some documentation of
    // what they're for beyond just a name.
    public string Purpose { get; set; } = string.Empty;

    public bool Restricted { get; set; }

    public List<string> AllowedUsers { get; set; } = new();

    // Portal login of whoever created this branch through the portal — empty
    // for branches that existed before this was tracked, or were created
    // outside the portal. Drives "the creator or an admin can delete it."
    public string Creator { get; set; } = string.Empty;
}
