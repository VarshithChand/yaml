using System.Net;
using System.Text;
using DeploymentAPI.DTOs;
using DeploymentAPI.Helpers;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json.Linq;
using YamlDotNet.Serialization;

namespace DeploymentAPI.Services;

public class GitHubApiService
{
    private readonly GitHubAuthService _auth;
    private readonly IMemoryCache _cache;

    // Long enough that the frontend's polling (every 20-30s on the Dashboard,
    // History, Analytics and Timeline pages) is served from cache on every
    // tick except the first — without this, those polls alone exhaust
    // GitHub's 60/hour anonymous limit within minutes of a single page being
    // left open, making "view without a token" effectively not work.
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(20);

    public GitHubApiService(GitHubAuthService auth, IMemoryCache cache)
    {
        _auth = auth;
        _cache = cache;
    }

    private Task<T> GetCachedAsync<T>(string key, Func<Task<T>> factory)
    {
        return _cache.GetOrCreateAsync(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return factory();
        })!;
    }

    //===========================================================
    // Repository Preview (Settings page — check a repo before saving it)
    //===========================================================

    public async Task<RepositoryPreviewDto> PreviewRepositoryAsync(string owner, string repository)
    {
        var client = _auth.CreateClient();

        try
        {
            var repoJson = await HttpClientHelper.GetAsync(
                client, $"https://api.github.com/repos/{owner}/{repository}");

            var repo = JObject.Parse(repoJson);

            var branchesResponse = await client.GetAsync(
                $"https://api.github.com/repos/{owner}/{repository}/branches?per_page=100");

            await HttpClientHelper.EnsureSuccessAsync(branchesResponse);

            var branches = JArray.Parse(await branchesResponse.Content.ReadAsStringAsync());

            var branchCountApproximate =
                branchesResponse.Headers.TryGetValues("Link", out var linkValues)
                && linkValues.Any(v => v.Contains("rel=\"next\""));

            var workflowsJson = await HttpClientHelper.GetAsync(
                client, $"https://api.github.com/repos/{owner}/{repository}/actions/workflows");

            var workflowCount = (int?)JObject.Parse(workflowsJson)["total_count"] ?? 0;

            return new RepositoryPreviewDto
            {
                Found = true,
                Owner = repo["owner"]?["login"]?.ToString() ?? owner,
                Name = repo["name"]?.ToString() ?? repository,
                Description = repo["description"]?.ToString() ?? string.Empty,
                DefaultBranch = repo["default_branch"]?.ToString() ?? string.Empty,
                Private = (bool?)repo["private"] ?? false,
                Stars = (int?)repo["stargazers_count"] ?? 0,
                BranchCount = branches.Count,
                BranchCountApproximate = branchCountApproximate,
                WorkflowCount = workflowCount,
                HtmlUrl = repo["html_url"]?.ToString() ?? string.Empty
            };
        }
        catch (HttpRequestException ex)
        {
            return new RepositoryPreviewDto
            {
                Found = false,
                Error = ex.StatusCode == HttpStatusCode.NotFound
                    ? "Repository not found — check the URL, or it may be private."
                    : ex.Message
            };
        }
    }

    //===========================================================
    // Rate Limit (shown next to "Public view" in the top bar)
    //===========================================================

    // Checking /rate_limit does not itself consume any of the quota it
    // reports, so this is always fetched fresh rather than cached.
    public async Task<RateLimitDto> GetRateLimitAsync()
    {
        var client = _auth.CreateClient();

        var json = await HttpClientHelper.GetAsync(client, "https://api.github.com/rate_limit");

        var core = JObject.Parse(json)["resources"]?["core"];

        return new RateLimitDto
        {
            Limit = (int?)core?["limit"] ?? 0,

            Remaining = (int?)core?["remaining"] ?? 0,

            ResetAt = DateTimeOffset
                .FromUnixTimeSeconds((long?)core?["reset"] ?? 0)
                .UtcDateTime
        };
    }

    //===========================================================
    // Repository
    //===========================================================

    public Task<string> GetRepository() =>
        GetCachedAsync($"repo:{_auth.Owner}/{_auth.Repository}", async () =>
        {
            var client = _auth.CreateClient();

            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}";

            return await HttpClientHelper.GetAsync(client, url);
        });

    //===========================================================
    // Branches
    //===========================================================

    public Task<List<BranchDto>> GetBranches() =>
        GetCachedAsync($"branches:{_auth.Owner}/{_auth.Repository}", async () =>
        {
            var client = _auth.CreateClient();

            // GitHub defaults list endpoints to 30 results per page — without
            // per_page=100, repos with more branches than that would silently
            // drop the rest from the Deploy page's branch picker.
            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/branches?per_page=100";

            var json = await HttpClientHelper.GetAsync(client, url);

            var array = JArray.Parse(json);

            return array.Select(x => new BranchDto
            {
                Name = x["name"]?.ToString() ?? ""
            }).ToList();
        });

    //===========================================================
    // Artifacts
    //===========================================================

    public Task<List<ArtifactDto>> GetArtifacts() =>
        GetCachedAsync($"artifacts:{_auth.Owner}/{_auth.Repository}", async () =>
        {
            var client = _auth.CreateClient();

            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/artifacts?per_page=100";

            var json = await HttpClientHelper.GetAsync(client, url);

            var root = JObject.Parse(json);

            var artifacts = root["artifacts"] as JArray;

            if (artifacts == null)
                return new List<ArtifactDto>();

            // publish-files-* is an internal hand-off artifact used only within
            // a single workflow run (the build job uploads it, the rotate/store
            // job downloads it a few steps later) — it was never meant to be a
            // user-facing deliverable, so it's excluded here rather than
            // cluttering the list/count alongside the real *-Latest/ReleaseZip/
            // StagedPackage artifacts people actually care about.
            var runsById = (await GetWorkflowRuns())
                .ToDictionary(r => r.Id, r => r);

            return artifacts
                .Where(x => !(x["name"]?.ToString() ?? "").StartsWith("publish-files", StringComparison.OrdinalIgnoreCase))
                .Select(x =>
                {
                    var runId = (long?)x["workflow_run"]?["id"] ?? 0;
                    runsById.TryGetValue(runId, out var run);

                    return new ArtifactDto
                    {
                        Id = (long?)x["id"] ?? 0,

                        Name = x["name"]?.ToString() ?? string.Empty,

                        Size = (long?)x["size_in_bytes"] ?? 0,

                        Expired = (bool?)x["expired"] ?? false,

                        CreatedAt = DateTime.TryParse(
                            x["created_at"]?.ToString(),
                            out var createdAt)
                                 ? createdAt
                                 : DateTime.MinValue,

                        DownloadUrl = x["archive_download_url"]?.ToString() ?? string.Empty,

                        Branch = x["workflow_run"]?["head_branch"]?.ToString() ?? string.Empty,

                        CommitSha = x["workflow_run"]?["head_sha"]?.ToString() ?? string.Empty,

                        CommitMessage = run?.CommitMessage ?? string.Empty,

                        WorkflowRunUrl = runId > 0
                            ? $"https://github.com/{_auth.Owner}/{_auth.Repository}/actions/runs/{runId}"
                            : string.Empty
                    };
                })
                .ToList();
        });

    // GitHub always requires an authenticated request to download an artifact's
    // zip, even for public repos — a plain browser link can't attach our PAT,
    // so the API proxies the download through the server-side token instead.
    public async Task<(byte[] Content, string FileName)> DownloadArtifactAsync(long artifactId)
    {
        var client = _auth.CreateClient();

        var url =
            $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/artifacts/{artifactId}/zip";

        var response = await client.GetAsync(url);

        await HttpClientHelper.EnsureSuccessAsync(response);

        var bytes = await response.Content.ReadAsByteArrayAsync();

        return (bytes, $"artifact-{artifactId}.zip");
    }

    public async Task DeleteArtifactAsync(long artifactId)
    {
        var client = _auth.CreateClient();

        var url =
            $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/artifacts/{artifactId}";

        var response = await client.DeleteAsync(url);

        await HttpClientHelper.EnsureSuccessAsync(response);

        // Otherwise the deleted artifact would still show up in the list for
        // up to CacheDuration, since GetArtifacts() caches its response.
        _cache.Remove($"artifacts:{_auth.Owner}/{_auth.Repository}");
    }

    //===========================================================
    // Docker / Container Images (GitHub Container Registry)
    //===========================================================

    public Task<List<DockerImageDto>> GetDockerImages() =>
        GetCachedAsync($"packages:{_auth.Owner}", async () =>
        {
            var client = _auth.CreateClient();

            // Container packages are scoped to the same GitHub owner as the
            // configured PAT — an org and a user use different list endpoints,
            // and the PAT only ever has read:packages access to its own owner.
            JArray packages;

            try
            {
                var json = await HttpClientHelper.GetAsync(
                    client,
                    $"https://api.github.com/orgs/{_auth.Owner}/packages?package_type=container&per_page=100");

                packages = JArray.Parse(json);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                var json = await HttpClientHelper.GetAsync(
                    client,
                    $"https://api.github.com/users/{_auth.Owner}/packages?package_type=container&per_page=100");

                packages = JArray.Parse(json);
            }

            return packages.Select(x => new DockerImageDto
            {
                Name = x["name"]?.ToString() ?? string.Empty,

                Visibility = x["visibility"]?.ToString() ?? string.Empty,

                VersionCount = (int?)x["version_count"] ?? 0,

                Repository = x["repository"]?["full_name"]?.ToString() ?? string.Empty,

                HtmlUrl = x["html_url"]?.ToString() ?? string.Empty,

                UpdatedAt = DateTime.TryParse(x["updated_at"]?.ToString(), out var updatedAt)
                    ? updatedAt
                    : DateTime.MinValue

            }).ToList();
        });

    //===========================================================
    // Workflows
    //===========================================================

    public Task<string> GetWorkflows() =>
        GetCachedAsync($"workflows:{_auth.Owner}/{_auth.Repository}", async () =>
        {
            var client = _auth.CreateClient();

            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/workflows?per_page=100";

            return await HttpClientHelper.GetAsync(client, url);
        });

    //===========================================================
    // Workflow Inputs (parsed from the workflow's own YAML, so the Deploy
    // page can render only the fields a given workflow actually declares)
    //===========================================================

    public async Task<List<WorkflowInputDto>> GetWorkflowInputsAsync(string workflowPath, string? branch)
    {
        var client = _auth.CreateClient();

        var refQuery = string.IsNullOrWhiteSpace(branch) ? "" : $"?ref={Uri.EscapeDataString(branch)}";

        var contentJson = await HttpClientHelper.GetAsync(
            client,
            $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/contents/{workflowPath}{refQuery}");

        var base64 = JObject.Parse(contentJson)["content"]?.ToString() ?? "";
        var yamlText = Encoding.UTF8.GetString(Convert.FromBase64String(base64.Replace("\n", "").Replace("\r", "")));

        var deserializer = new DeserializerBuilder().Build();
        var root = deserializer.Deserialize<Dictionary<object, object>>(yamlText);

        // YAML 1.1 (which YamlDotNet follows by default) treats a bare "on" as
        // the boolean `true` — GitHub Actions always uses it as the trigger
        // key regardless, so check for both forms the parser might produce.
        object? onValue = root.TryGetValue("on", out var onByString)
            ? onByString
            : root.TryGetValue(true, out var onByBool) ? onByBool : null;

        if (onValue is not IDictionary<object, object> onMap)
            return new List<WorkflowInputDto>();

        if (!onMap.TryGetValue("workflow_dispatch", out var dispatchValue)
            || dispatchValue is not IDictionary<object, object> dispatchMap)
            return new List<WorkflowInputDto>();

        if (!dispatchMap.TryGetValue("inputs", out var inputsValue)
            || inputsValue is not IDictionary<object, object> inputsMap)
            return new List<WorkflowInputDto>();

        var result = new List<WorkflowInputDto>();

        foreach (var entry in inputsMap)
        {
            var spec = entry.Value as IDictionary<object, object>;

            var required =
                spec != null
                && spec.TryGetValue("required", out var requiredRaw)
                && bool.TryParse(requiredRaw?.ToString(), out var requiredBool)
                && requiredBool;

            List<string>? options = null;

            if (spec != null
                && spec.TryGetValue("options", out var optionsRaw)
                && optionsRaw is IEnumerable<object> optionsList)
            {
                options = optionsList.Select(o => o?.ToString() ?? "").ToList();
            }

            result.Add(new WorkflowInputDto
            {
                Name = entry.Key?.ToString() ?? "",
                Type = spec != null && spec.TryGetValue("type", out var type) ? type?.ToString() ?? "string" : "string",
                Required = required,
                Default = spec != null && spec.TryGetValue("default", out var def) ? def?.ToString() : null,
                Description = spec != null && spec.TryGetValue("description", out var desc) ? desc?.ToString() : null,
                Options = options
            });
        }

        return result;
    }

    //===========================================================
    // Workflow Runs (History)
    //===========================================================

    public Task<List<WorkflowDto>> GetWorkflowRuns() =>
        GetCachedAsync($"runs:{_auth.Owner}/{_auth.Repository}", async () =>
        {
            var client = _auth.CreateClient();

            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/runs?per_page=100";

            var json = await HttpClientHelper.GetAsync(client, url);

            var root = JObject.Parse(json);

            var runs = root["workflow_runs"] as JArray;

            if (runs == null)
                return new List<WorkflowDto>();

            return runs.Select(MapRun).ToList();
        });

    //===========================================================
    // Single Workflow Run (Live Progress)
    //===========================================================

    public Task<WorkflowDto?> GetWorkflowRun(long runId) =>
        GetCachedAsync($"run:{_auth.Owner}/{_auth.Repository}/{runId}", async () =>
        {
            var client = _auth.CreateClient();

            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/runs/{runId}";

            var json = await HttpClientHelper.GetAsync(client, url);

            return (WorkflowDto?)MapRun(JObject.Parse(json));
        });

    private static WorkflowDto MapRun(JToken x) => new()
    {
        Id = (long?)x["id"] ?? 0,

        Name = x["name"]?.ToString() ?? string.Empty,

        Branch = x["head_branch"]?.ToString() ?? string.Empty,

        Status = x["status"]?.ToString() ?? string.Empty,

        Conclusion = x["conclusion"]?.ToString() ?? string.Empty,

        TriggeredBy = x["actor"]?["login"]?.ToString() ?? string.Empty,

        CreatedAt = DateTime.TryParse(
            x["created_at"]?.ToString(),
            out var createdAt)
                 ? createdAt
                 : DateTime.MinValue,

        CommitMessage = x["head_commit"]?["message"]?.ToString() ?? string.Empty
    };
}
