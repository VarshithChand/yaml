namespace DeploymentAPI.Configuration;

public class GitHubSettings
{
    public string Owner { get; set; } = string.Empty;

    public string Repository { get; set; } = string.Empty;

    public string PersonalAccessToken { get; set; } = string.Empty;
}