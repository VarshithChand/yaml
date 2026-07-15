namespace DeploymentAPI.DTOs;

public class GitHubOAuthUpdateDto
{
    public string ClientId { get; set; } = string.Empty;

    // Left blank/null keeps the previously saved secret instead of clearing it.
    public string? ClientSecret { get; set; }
}
