using DeploymentAPI.Configuration;
using Microsoft.Extensions.Options;

namespace DeploymentAPI.Services;

public class GitHubAuthService
{
    private readonly IOptionsMonitor<GitHubSettings> _options;

    public GitHubAuthService(IOptionsMonitor<GitHubSettings> options)
    {
        _options = options;
    }

    private GitHubSettings Settings => _options.CurrentValue;

    public HttpClient CreateClient()
    {
        var client = new HttpClient();

        // Skip the header entirely when no token is configured — sending
        // "Bearer " with an empty value gets rejected by GitHub instead of
        // being treated as an anonymous request.
        if (!string.IsNullOrWhiteSpace(Settings.PersonalAccessToken))
        {
            client.DefaultRequestHeaders.Add(
                "Authorization",
                $"Bearer {Settings.PersonalAccessToken}");
        }

        client.DefaultRequestHeaders.Add(
            "User-Agent",
            "DeploymentPortal");

        client.DefaultRequestHeaders.Add(
            "Accept",
            "application/vnd.github+json");

        return client;
    }

    public string Owner => Settings.Owner;

    public string Repository => Settings.Repository;
}