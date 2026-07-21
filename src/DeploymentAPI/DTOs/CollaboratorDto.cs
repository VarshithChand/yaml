namespace DeploymentAPI.DTOs;

// A person with direct access to the repository — Permission mirrors
// GitHub's own role_name ("read"/"triage"/"write"/"maintain"/"admin"),
// the same five-level scale GitHub itself uses to segregate what a
// collaborator can do, so the portal doesn't invent its own scheme.
public class CollaboratorDto
{
    public string Login { get; set; } = string.Empty;

    public string AvatarUrl { get; set; } = string.Empty;

    public string Permission { get; set; } = string.Empty;
}
