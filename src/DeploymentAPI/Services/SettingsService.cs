using DeploymentAPI.DTOs;
using Newtonsoft.Json.Linq;

namespace DeploymentAPI.Services;

// Reads/writes appsettings.Local.json directly (the gitignored file that overrides
// appsettings.json) so credentials entered via the Settings page are never
// stored in the browser and never land in a file that gets committed.
public class SettingsService
{
    private readonly string _localSettingsPath;

    public SettingsService(IHostEnvironment env)
    {
        // SETTINGS_FILE_PATH lets a deployment point this at a mounted
        // persistent volume (e.g. Fly.io) instead of the app's own content
        // root, which is typically wiped and replaced on every redeploy.
        // Program.cs points AddJsonFile at the same path, so reads and
        // writes always agree on where the file lives.
        var overridePath = Environment.GetEnvironmentVariable("SETTINGS_FILE_PATH");

        _localSettingsPath = string.IsNullOrWhiteSpace(overridePath)
            ? Path.Combine(env.ContentRootPath, "appsettings.Local.json")
            : overridePath;
    }

    public async Task<SettingsViewDto> GetViewAsync()
    {
        var root = await ReadRootAsync();
        return BuildView(root);
    }

    public async Task<SettingsViewDto> SaveGitHubAsync(GitHubSettingsUpdateDto update)
    {
        var root = await ReadRootAsync();

        var github = root["GitHub"] as JObject ?? new JObject();

        github["Owner"] = update.Owner;
        github["Repository"] = update.Repository;

        if (!string.IsNullOrWhiteSpace(update.PersonalAccessToken))
            github["PersonalAccessToken"] = update.PersonalAccessToken;

        root["GitHub"] = github;

        await WriteRootAsync(root);

        return BuildView(root);
    }

    public async Task<SettingsViewDto> SaveDockerAsync(DockerSettingsUpdateDto update)
    {
        var root = await ReadRootAsync();

        var docker = root["Docker"] as JObject ?? new JObject();

        docker["Registry"] = update.Registry;
        docker["Username"] = update.Username;

        if (!string.IsNullOrWhiteSpace(update.Password))
            docker["Password"] = update.Password;

        root["Docker"] = docker;

        await WriteRootAsync(root);

        return BuildView(root);
    }

    public async Task<SettingsViewDto> SaveGitHubOAuthAsync(GitHubOAuthUpdateDto update)
    {
        var root = await ReadRootAsync();

        var oauth = root["GitHubOAuth"] as JObject ?? new JObject();

        oauth["ClientId"] = update.ClientId;

        if (!string.IsNullOrWhiteSpace(update.ClientSecret))
            oauth["ClientSecret"] = update.ClientSecret;

        root["GitHubOAuth"] = oauth;

        await WriteRootAsync(root);

        return BuildView(root);
    }

    public async Task<SettingsViewDto> SaveAdminUsernamesAsync(AdminUsernamesUpdateDto update)
    {
        var root = await ReadRootAsync();

        var auth = root["Auth"] as JObject ?? new JObject();

        auth["AdminGitHubUsernames"] = new JArray(update.AdminGitHubUsernames);

        root["Auth"] = auth;

        await WriteRootAsync(root);

        return BuildView(root);
    }

    // "Clear" removes only the secret field, leaving non-secret identifiers
    // (Owner/Repository, Docker Registry/Username, OAuth ClientId) in place —
    // a null SecretField means the whole section IS the thing being cleared.
    private static readonly Dictionary<string, (string SectionKey, string? SecretField)> SectionInfo = new()
    {
        ["github"] = ("GitHub", "PersonalAccessToken"),
        ["docker"] = ("Docker", "Password"),
        ["github-oauth"] = ("GitHubOAuth", "ClientSecret"),
        ["admins"] = ("Auth", null)
    };

    // Unlike a per-section clear (which only removes the secret, leaving the
    // repo URL / registry / client ID in place), "all" wipes every
    // configurable section entirely — including GitHub Owner/Repository —
    // resetting the portal back to its unconfigured, first-run state. Jwt
    // is deliberately left alone so existing sessions/cookies stay valid.
    public async Task<SettingsViewDto> ClearAllAsync()
    {
        var root = await ReadRootAsync();

        root.Remove("GitHub");
        root.Remove("Docker");
        root.Remove("GitHubOAuth");
        root.Remove("Auth");

        await WriteRootAsync(root);

        return BuildView(root);
    }

    public async Task<SettingsViewDto> ClearAsync(string section)
    {
        if (section == "all")
            return await ClearAllAsync();

        if (!SectionInfo.TryGetValue(section, out var info))
            throw new ArgumentException($"Unknown settings section '{section}'.");

        var root = await ReadRootAsync();

        if (info.SecretField == null)
        {
            root.Remove(info.SectionKey);
        }
        else if (root[info.SectionKey] is JObject existing)
        {
            existing.Remove(info.SecretField);
        }

        await WriteRootAsync(root);

        return BuildView(root);
    }

    private static SettingsViewDto BuildView(JObject root)
    {
        var github = root["GitHub"] as JObject;
        var docker = root["Docker"] as JObject;
        var oauth = root["GitHubOAuth"] as JObject;
        var auth = root["Auth"] as JObject;

        var admins = (auth?["AdminGitHubUsernames"] as JArray)?
            .Select(x => x.ToString())
            .ToList() ?? new List<string>();

        return new SettingsViewDto
        {
            GitHubOwner = github?["Owner"]?.ToString() ?? string.Empty,
            GitHubRepository = github?["Repository"]?.ToString() ?? string.Empty,
            GitHubTokenConfigured = !string.IsNullOrWhiteSpace(github?["PersonalAccessToken"]?.ToString()),

            DockerRegistry = docker?["Registry"]?.ToString() ?? string.Empty,
            DockerUsername = docker?["Username"]?.ToString() ?? string.Empty,
            DockerPasswordConfigured = !string.IsNullOrWhiteSpace(docker?["Password"]?.ToString()),

            GitHubOAuthClientId = oauth?["ClientId"]?.ToString() ?? string.Empty,
            GitHubOAuthClientSecretConfigured = !string.IsNullOrWhiteSpace(oauth?["ClientSecret"]?.ToString()),

            AdminGitHubUsernames = admins
        };
    }

    private async Task<JObject> ReadRootAsync()
    {
        if (!File.Exists(_localSettingsPath))
            return new JObject();

        var text = await File.ReadAllTextAsync(_localSettingsPath);

        return string.IsNullOrWhiteSpace(text)
            ? new JObject()
            : JObject.Parse(text);
    }

    private async Task WriteRootAsync(JObject root)
    {
        var directory = Path.GetDirectoryName(_localSettingsPath);

        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        await File.WriteAllTextAsync(_localSettingsPath, root.ToString());
    }
}
