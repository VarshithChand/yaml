namespace DeploymentAPI.Configuration;

// Simple username allowlist for the Admin role; anyone who logs in via
// GitHub OAuth and isn't on this list gets the Viewer role.
public class AuthorizationSettings
{
    public List<string> AdminGitHubUsernames { get; set; } = new();
}
