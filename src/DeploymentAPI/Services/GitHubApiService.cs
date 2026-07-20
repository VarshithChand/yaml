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

    // forceRefresh drops the cached entry first — used by a user-initiated
    // "Refresh" click, which is infrequent and intentional, unlike the
    // automatic polling this cache exists to protect against. Without this,
    // clicking Refresh shortly after a page loads (well within the 20s
    // window) silently returns the same stale response, since nothing ever
    // told the cache the data was actually asked for on purpose.
    private Task<T> GetCachedAsync<T>(string key, Func<Task<T>> factory, bool forceRefresh = false)
    {
        if (forceRefresh) _cache.Remove(key);

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
    // Token Owner (top bar — shown instead of "Set up GitHub Login" once a
    // Personal Access Token is configured)
    //===========================================================

    public Task<TokenOwnerDto> GetTokenOwnerAsync()
    {
        if (!_auth.HasToken)
            return Task.FromResult(new TokenOwnerDto { Configured = false });

        return GetCachedAsync($"token-owner:{_auth.Owner}/{_auth.Repository}", async () =>
        {
            var client = _auth.CreateClient();

            var userJson = await HttpClientHelper.GetAsync(client, "https://api.github.com/user");
            var user = JObject.Parse(userJson);

            // The repo endpoint includes a "permissions" block scoped to the
            // authenticated token when the token can see the repo at all.
            // "admin" is the same bit GitHub itself checks to let someone
            // approve a protected-environment deployment they weren't
            // explicitly named a reviewer on.
            var repoJson = await HttpClientHelper.GetAsync(
                client, $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}");

            var repo = JObject.Parse(repoJson);
            var canApprove = (bool?)repo["permissions"]?["admin"] ?? false;

            return new TokenOwnerDto
            {
                Configured = true,
                Login = user["login"]?.ToString() ?? string.Empty,
                AvatarUrl = user["avatar_url"]?.ToString() ?? string.Empty,
                CanApprove = canApprove
            };
        });
    }

    //===========================================================
    // Repository
    //===========================================================

    public Task<string> GetRepository(bool forceRefresh = false) =>
        GetCachedAsync($"repo:{_auth.Owner}/{_auth.Repository}", async () =>
        {
            var client = _auth.CreateClient();

            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}";

            return await HttpClientHelper.GetAsync(client, url);
        }, forceRefresh);

    //===========================================================
    // Branches
    //===========================================================

    public Task<List<BranchDto>> GetBranches(bool forceRefresh = false) =>
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
        }, forceRefresh);

    //===========================================================
    // Artifacts
    //===========================================================

    public Task<List<ArtifactDto>> GetArtifacts(bool forceRefresh = false) =>
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
        }, forceRefresh);

    //===========================================================
    // Latest Run For A Workflow (Deploy page — "what did this do last time?")
    //===========================================================

    public Task<LatestRunSummaryDto> GetLatestRunSummaryAsync(string workflow, string? branch) =>
        GetCachedAsync($"last-run:{_auth.Owner}/{_auth.Repository}/{workflow}/{branch}", async () =>
        {
            var client = _auth.CreateClient();

            var workflowId = NormalizeWorkflowId(workflow);

            var branchQuery = string.IsNullOrWhiteSpace(branch)
                ? string.Empty
                : $"&branch={Uri.EscapeDataString(branch)}";

            var runsUrl =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/workflows/{workflowId}/runs" +
                $"?per_page=1{branchQuery}";

            var runsJson = await HttpClientHelper.GetAsync(client, runsUrl);
            var latestRun = (JObject.Parse(runsJson)["workflow_runs"] as JArray)?.FirstOrDefault();

            if (latestRun == null)
                return new LatestRunSummaryDto();

            var run = MapRun(latestRun);

            // The dedicated per-run artifacts endpoint, not the repo-wide list —
            // this only returns what that specific run produced.
            var artifactsUrl =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/runs/{run.Id}/artifacts";

            var artifactsJson = await HttpClientHelper.GetAsync(client, artifactsUrl);

            var artifact = (JObject.Parse(artifactsJson)["artifacts"] as JArray)?
                .Where(a => !(a["name"]?.ToString() ?? "").StartsWith("publish-files", StringComparison.OrdinalIgnoreCase))
                .Select(a => new ArtifactDto
                {
                    Id = (long?)a["id"] ?? 0,

                    Name = a["name"]?.ToString() ?? string.Empty,

                    Size = (long?)a["size_in_bytes"] ?? 0,

                    Expired = (bool?)a["expired"] ?? false,

                    CreatedAt = DateTime.TryParse(a["created_at"]?.ToString(), out var createdAt)
                        ? createdAt
                        : DateTime.MinValue,

                    DownloadUrl = a["archive_download_url"]?.ToString() ?? string.Empty
                })
                .FirstOrDefault();

            return new LatestRunSummaryDto { Run = run, Artifact = artifact };
        });

    // Accepts either the bare file name ("admin.yml"), the full repo-relative
    // path (".github/workflows/admin.yml"), or a numeric workflow ID — GitHub's
    // API only understands the first and third forms.
    private static string NormalizeWorkflowId(string workflow)
    {
        var lastSlash = workflow.LastIndexOf('/');
        return lastSlash >= 0 ? workflow[(lastSlash + 1)..] : workflow;
    }

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

    public Task<string> GetWorkflows(bool forceRefresh = false) =>
        GetCachedAsync($"workflows:{_auth.Owner}/{_auth.Repository}", async () =>
        {
            var client = _auth.CreateClient();

            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/workflows?per_page=100";

            return await HttpClientHelper.GetAsync(client, url);
        }, forceRefresh);

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

    //===========================================================
    // Pending Approvals (protected-environment review gate)
    //===========================================================

    // GitHub reports a run paused at a required-reviewer environment gate
    // (RC, Cluster01/02/03, ...) with its own status of "waiting" — checking
    // only those (rarely more than one or two at a time out of everything
    // in the recent-runs list) avoids a pending_deployments call per run.
    public async Task<List<PendingApprovalDto>> GetPendingApprovalsAsync()
    {
        var runs = await GetWorkflowRuns();

        var waitingRuns = runs.Where(r => r.Status == "waiting").ToList();

        if (waitingRuns.Count == 0)
            return new List<PendingApprovalDto>();

        var client = _auth.CreateClient();

        var result = new List<PendingApprovalDto>();

        foreach (var run in waitingRuns)
        {
            var url =
                $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/runs/{run.Id}/pending_deployments";

            var json = await HttpClientHelper.GetAsync(client, url);
            var array = JArray.Parse(json);

            if (array.Count == 0)
                continue;

            result.Add(new PendingApprovalDto
            {
                RunId = run.Id,
                WorkflowName = run.Name,
                Branch = run.Branch,
                TriggeredBy = run.TriggeredBy,
                CreatedAt = run.CreatedAt,
                CommitMessage = run.CommitMessage,
                Environments = array.Select(e => new PendingEnvironmentDto
                {
                    Id = (long?)e["environment"]?["id"] ?? 0,

                    Name = e["environment"]?["name"]?.ToString() ?? string.Empty,

                    Reviewers = (e["reviewers"] as JArray)?
                        .Select(r => r["reviewer"]?["login"]?.ToString() ?? r["reviewer"]?["name"]?.ToString() ?? string.Empty)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .ToList() ?? new List<string>()
                }).ToList()
            });
        }

        return result;
    }

    public async Task SubmitApprovalAsync(ApprovalDecisionDto decision)
    {
        var client = _auth.CreateClient();

        var url =
            $"https://api.github.com/repos/{_auth.Owner}/{_auth.Repository}/actions/runs/{decision.RunId}/pending_deployments";

        var body = new
        {
            environment_ids = decision.EnvironmentIds,
            state = decision.Approve ? "approved" : "rejected",
            comment = string.IsNullOrWhiteSpace(decision.Comment)
                ? (decision.Approve ? "Approved via Deployment Portal" : "Rejected via Deployment Portal")
                : decision.Comment
        };

        var json = System.Text.Json.JsonSerializer.Serialize(body);

        var response = await client.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));

        await HttpClientHelper.EnsureSuccessAsync(response);

        // The decided run is no longer "waiting" — drop the cached runs
        // list so this page (and Dashboard/History) reflect that
        // immediately instead of for up to CacheDuration.
        _cache.Remove($"runs:{_auth.Owner}/{_auth.Repository}");
    }

    //===========================================================
    // Approval History (recent outcomes of release/deploy runs)
    //===========================================================

    // GitHub doesn't expose a dedicated "who approved/rejected and when"
    // log for non-Enterprise repos — this is the closest honest
    // approximation available: the most recent completed runs of
    // release/deploy-shaped workflows, so a decision's eventual outcome
    // (success, failure, or cancelled — which is what a rejection and a
    // manual cancel both surface as) is visible without a trip to GitHub.
    public async Task<List<WorkflowDto>> GetApprovalHistoryAsync()
    {
        var runs = await GetWorkflowRuns();

        return runs
            .Where(r => r.Status == "completed"
                && System.Text.RegularExpressions.Regex.IsMatch(r.Name, "release|deploy", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .ToList();
    }

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
