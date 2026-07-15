namespace DeploymentAPI.DTOs;

public class GitHubSettingsUpdateDto
{
    public string Owner { get; set; } = string.Empty;

    public string Repository { get; set; } = string.Empty;

    // Left blank/null keeps the previously saved token instead of clearing it.
    public string? PersonalAccessToken { get; set; }
}
