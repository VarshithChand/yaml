namespace DeploymentAPI.DTOs;

// Safe-to-return view of stored settings — secrets are never echoed back,
// only whether one has been saved.
public class SettingsViewDto
{
    public string GitHubOwner { get; set; } = string.Empty;

    public string GitHubRepository { get; set; } = string.Empty;

    public bool GitHubTokenConfigured { get; set; }

    public string DockerRegistry { get; set; } = string.Empty;

    public string DockerUsername { get; set; } = string.Empty;

    public bool DockerPasswordConfigured { get; set; }

    public string GitHubOAuthClientId { get; set; } = string.Empty;

    public bool GitHubOAuthClientSecretConfigured { get; set; }

    public List<string> AdminGitHubUsernames { get; set; } = new();
}
