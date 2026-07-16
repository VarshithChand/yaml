import { useEffect, useState } from "react";

import {
    getSettings,
    saveGitHubSettings,
    saveDockerSettings,
    saveGitHubOAuthSettings,
    saveAdminUsernames,
    clearSettings,
    previewGitHubRepository
} from "../services/settingsService";

import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/layout/PageLayout";
import useToast from "../hooks/useToast";
import useAuth from "../hooks/useAuth";
import useNavigation from "../hooks/useNavigation";
import parseRepoUrl from "../utils/parseRepoUrl";

export default function Settings() {

    const toast = useToast();
    const { refreshOauthStatus } = useAuth();
    const { pendingRepoUrl, setPendingRepoUrl } = useNavigation();

    const [loading, setLoading] = useState(true);

    const [savingGitHub, setSavingGitHub] = useState(false);
    const [savingDocker, setSavingDocker] = useState(false);
    const [savingOAuth, setSavingOAuth] = useState(false);
    const [savingAdmins, setSavingAdmins] = useState(false);

    const [githubRepoUrl, setGithubRepoUrl] = useState("");
    const [githubToken, setGithubToken] = useState("");
    const [githubTokenConfigured, setGithubTokenConfigured] = useState(false);

    const [repoPreview, setRepoPreview] = useState(null);
    const [repoPreviewLoading, setRepoPreviewLoading] = useState(false);

    // Drives the highlighted "Generate a token" link below — GitHub's 60/hour
    // anonymous limit is the single most common reason someone lands here.
    const isRateLimited = !!(
        repoPreview && !repoPreview.found && /rate limit/i.test(repoPreview.error || "")
    );

    const [dockerRegistry, setDockerRegistry] = useState("");
    const [dockerUsername, setDockerUsername] = useState("");
    const [dockerPassword, setDockerPassword] = useState("");
    const [dockerPasswordConfigured, setDockerPasswordConfigured] = useState(false);

    const [oauthClientId, setOauthClientId] = useState("");
    const [oauthClientSecret, setOauthClientSecret] = useState("");
    const [oauthClientSecretConfigured, setOauthClientSecretConfigured] = useState(false);

    const [adminUsernamesText, setAdminUsernamesText] = useState("");

    async function load() {

        try {

            const data = await getSettings();

            setGithubRepoUrl(
                data.gitHubOwner && data.gitHubRepository
                    ? `https://github.com/${data.gitHubOwner}/${data.gitHubRepository}`
                    : ""
            );
            setGithubTokenConfigured(!!data.gitHubTokenConfigured);

            setDockerRegistry(data.dockerRegistry || "");
            setDockerUsername(data.dockerUsername || "");
            setDockerPasswordConfigured(!!data.dockerPasswordConfigured);

            setOauthClientId(data.gitHubOAuthClientId || "");
            setOauthClientSecretConfigured(!!data.gitHubOAuthClientSecretConfigured);

            setAdminUsernamesText((data.adminGitHubUsernames || []).join(", "));

        }
        catch (err) {

            console.error(err);
            toast.show("Unable to load settings.", "error");

        }
        finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        async function init() {

            await load();

            // Applied after load() so a repo carried over from the Public
            // Repository Lookup card wins over whatever was already saved.
            if (pendingRepoUrl) {
                setGithubRepoUrl(pendingRepoUrl);
                setPendingRepoUrl(null);
            }

        }

        init();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {

        const parsed = parseRepoUrl(githubRepoUrl);

        if (!parsed) {
            setRepoPreview(null);
            setRepoPreviewLoading(false);
            return;
        }

        let cancelled = false;

        setRepoPreviewLoading(true);

        const timer = setTimeout(async () => {

            try {

                const preview = await previewGitHubRepository(parsed.owner, parsed.repository);

                if (!cancelled) {
                    setRepoPreview(preview);
                }

            }
            catch (err) {

                console.error(err);

                if (!cancelled) {
                    setRepoPreview({ found: false, error: "Unable to reach GitHub." });
                }

            }
            finally {

                if (!cancelled) {
                    setRepoPreviewLoading(false);
                }

            }

        }, 600);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };

    }, [githubRepoUrl]);

    async function handleSaveGitHub() {

        const parsed = parseRepoUrl(githubRepoUrl);

        if (!parsed) {

            toast.show(
                "Enter a valid GitHub repository URL, e.g. https://github.com/owner/repo",
                "error"
            );

            return;

        }

        try {

            setSavingGitHub(true);

            await saveGitHubSettings({
                owner: parsed.owner,
                repository: parsed.repository,
                personalAccessToken: githubToken || null
            });

            setGithubToken("");
            toast.show(`GitHub settings saved: ${parsed.owner}/${parsed.repository}`, "success");
            load();
            refreshOauthStatus();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || "Failed to save GitHub settings.", "error");

        }
        finally {

            setSavingGitHub(false);

        }

    }

    async function handleSaveDocker() {

        try {

            setSavingDocker(true);

            await saveDockerSettings({
                registry: dockerRegistry,
                username: dockerUsername,
                password: dockerPassword || null
            });

            setDockerPassword("");
            toast.show("Docker settings saved.", "success");
            load();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || "Failed to save Docker settings.", "error");

        }
        finally {

            setSavingDocker(false);

        }

    }

    async function handleSaveOAuth() {

        try {

            setSavingOAuth(true);

            await saveGitHubOAuthSettings({
                clientId: oauthClientId,
                clientSecret: oauthClientSecret || null
            });

            setOauthClientSecret("");
            toast.show("GitHub OAuth settings saved.", "success");
            load();
            refreshOauthStatus();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || "Failed to save GitHub OAuth settings.", "error");

        }
        finally {

            setSavingOAuth(false);

        }

    }

    async function handleSaveAdmins() {

        try {

            setSavingAdmins(true);

            const usernames = adminUsernamesText
                .split(",")
                .map((u) => u.trim())
                .filter(Boolean);

            await saveAdminUsernames({ adminGitHubUsernames: usernames });

            toast.show("Admin allowlist saved.", "success");
            load();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || "Failed to save admin allowlist.", "error");

        }
        finally {

            setSavingAdmins(false);

        }

    }

    async function handleClear(section, label) {

        if (!window.confirm(`Clear all saved ${label}? This cannot be undone.`)) {
            return;
        }

        try {

            await clearSettings(section);

            if (section === "github") {
                setGithubToken("");
                refreshOauthStatus();
            }

            if (section === "docker") {
                setDockerPassword("");
            }

            if (section === "github-oauth") {
                setOauthClientSecret("");
                refreshOauthStatus();
            }

            toast.show(`${label} cleared.`, "success");
            load();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to clear ${label}.`, "error");

        }

    }

    if (loading) {
        return <LoadingSpinner />;
    }

    return (

        <PageLayout title="Settings">

            <div className="card">

                <h2 className="card-title">
                    GitHub Credentials
                </h2>

                <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                    Used by the backend to call the GitHub API on the portal's behalf.
                    Saved server-side in a gitignored local config file — never stored in the browser.
                </p>

                <div className="form-group">
                    <label>Repository URL</label>
                    <input
                        className="form-control"
                        placeholder="https://github.com/owner/repo"
                        value={githubRepoUrl}
                        onChange={(e) => setGithubRepoUrl(e.target.value)}
                    />
                    {githubRepoUrl.trim() && (

                        parseRepoUrl(githubRepoUrl) ? (

                            <p className="field-hint field-hint-good">
                                Owner: <strong>{parseRepoUrl(githubRepoUrl).owner}</strong>
                                {" "}&middot; Repository: <strong>{parseRepoUrl(githubRepoUrl).repository}</strong>
                            </p>

                        ) : (

                            <p className="field-hint field-hint-bad">
                                Doesn't look like a GitHub repository URL yet — expecting something like
                                https://github.com/owner/repo
                            </p>

                        )

                    )}

                    {repoPreviewLoading && (
                        <p className="field-hint">Fetching repository details...</p>
                    )}

                    {!repoPreviewLoading && repoPreview && (

                        repoPreview.found ? (

                            <div className="repo-preview">

                                {repoPreview.description && (
                                    <p className="repo-preview-description">
                                        {repoPreview.description}
                                    </p>
                                )}

                                <div className="repo-preview-stats">

                                    <span><strong>{repoPreview.branchCount}{repoPreview.branchCountApproximate ? "+" : ""}</strong> branches</span>

                                    <span><strong>{repoPreview.workflowCount}</strong> workflows</span>

                                    <span><strong>{repoPreview.stars}</strong> stars</span>

                                    <span>Default branch: <strong>{repoPreview.defaultBranch}</strong></span>

                                    <span>{repoPreview.private ? "Private" : "Public"}</span>

                                </div>

                            </div>

                        ) : (

                            <p className="field-hint field-hint-bad">
                                {repoPreview.error || "Repository not found."}
                            </p>

                        )

                    )}
                </div>

                <div className="form-group">
                    <label>
                        Personal Access Token
                        {" "}
                        {githubTokenConfigured && (
                            <span className="badge badge-success">Saved</span>
                        )}
                    </label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder={githubTokenConfigured ? "Token saved — click \"Clear Token\" to change it" : "ghp_..."}
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        disabled={githubTokenConfigured}
                    />
                    <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noreferrer"
                        className={`token-help-link ${isRateLimited ? "token-help-link-alert" : ""}`}
                    >
                        {isRateLimited
                            ? "Rate limit exceeded — generate a token on GitHub →"
                            : "Generate a token on GitHub →"}
                    </a>
                </div>

                <div className="button-row">

                    <button className="btn btn-primary" onClick={handleSaveGitHub} disabled={savingGitHub}>
                        {savingGitHub ? "Saving..." : "Save GitHub Settings"}
                    </button>

                    <button className="btn btn-danger" onClick={() => handleClear("github", "GitHub token")}>
                        Clear Token
                    </button>

                </div>

            </div>

            <div className="card">

                <h2 className="card-title">
                    Docker Registry Credentials
                </h2>

                <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                    Stored for future use — no build/push step in this portal reads these yet.
                </p>

                <div className="form-group">
                    <label>Registry</label>
                    <input
                        className="form-control"
                        placeholder="docker.io / ghcr.io / your-registry.com"
                        value={dockerRegistry}
                        onChange={(e) => setDockerRegistry(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Username</label>
                    <input
                        className="form-control"
                        value={dockerUsername}
                        onChange={(e) => setDockerUsername(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>
                        Password / Access Token
                        {" "}
                        {dockerPasswordConfigured && (
                            <span className="badge badge-success">Saved</span>
                        )}
                    </label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder={dockerPasswordConfigured ? "Leave blank to keep current password" : ""}
                        value={dockerPassword}
                        onChange={(e) => setDockerPassword(e.target.value)}
                    />
                </div>

                <div className="button-row">

                    <button className="btn btn-primary" onClick={handleSaveDocker} disabled={savingDocker}>
                        {savingDocker ? "Saving..." : "Save Docker Settings"}
                    </button>

                    <button className="btn btn-danger" onClick={() => handleClear("docker", "Docker password")}>
                        Clear Password
                    </button>

                </div>

            </div>

            <div className="card">

                <h2 className="card-title">
                    GitHub OAuth Login
                </h2>

                <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                    From your GitHub OAuth App at github.com/settings/developers. Callback URL must be
                    set to <code>http://localhost:5279/api/auth/github/callback</code>.
                </p>

                <div className="form-group">
                    <label>Client ID</label>
                    <input
                        className="form-control"
                        value={oauthClientId}
                        onChange={(e) => setOauthClientId(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>
                        Client Secret
                        {" "}
                        {oauthClientSecretConfigured && (
                            <span className="badge badge-success">Saved</span>
                        )}
                    </label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder={oauthClientSecretConfigured ? "Leave blank to keep current secret" : ""}
                        value={oauthClientSecret}
                        onChange={(e) => setOauthClientSecret(e.target.value)}
                    />
                </div>

                <div className="button-row">

                    <button className="btn btn-primary" onClick={handleSaveOAuth} disabled={savingOAuth}>
                        {savingOAuth ? "Saving..." : "Save OAuth Settings"}
                    </button>

                    <button className="btn btn-danger" onClick={() => handleClear("github-oauth", "GitHub OAuth client secret")}>
                        Clear Secret
                    </button>

                </div>

            </div>

            <div className="card">

                <h2 className="card-title">
                    Admin Allowlist
                </h2>

                <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                    GitHub usernames that get the Admin role on login. Everyone else who logs in gets Viewer.
                </p>

                <div className="form-group">
                    <label>GitHub Usernames (comma-separated)</label>
                    <input
                        className="form-control"
                        placeholder="octocat, hubot"
                        value={adminUsernamesText}
                        onChange={(e) => setAdminUsernamesText(e.target.value)}
                    />
                </div>

                <div className="button-row">

                    <button className="btn btn-primary" onClick={handleSaveAdmins} disabled={savingAdmins}>
                        {savingAdmins ? "Saving..." : "Save Admin Allowlist"}
                    </button>

                    <button className="btn btn-danger" onClick={() => handleClear("admins", "admin allowlist")}>
                        Clear
                    </button>

                </div>

            </div>

        </PageLayout>

    );

}
