# GitHub Deployment Portal

An internal CI/CD dashboard for triggering, monitoring, and rolling back GitHub Actions
deployments — a React/Vite frontend backed by an ASP.NET Core API that talks to the
GitHub REST API on your behalf.

- `deployment-ui/` — React frontend (dashboard, deploy form, history, analytics, settings)
- `src/DeploymentAPI/` — ASP.NET Core backend (GitHub API integration, auth, settings storage)
- `src/AdminAPI/`, `src/PMSCoreAPI/`, `src/SecurityAPI/` — the sample services this portal deploys
- `.github/workflows/` — the CI/CD pipelines the portal triggers

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download) (`dotnet --version` should print `10.x`)
- [Node.js 20+](https://nodejs.org/) with npm
- A GitHub repository to point the portal at, and (optionally) a
  [Personal Access Token](https://github.com/settings/tokens) with `repo` and `workflow`
  scopes — the portal works without one, but GitHub's API rate limit is 60 requests/hour
  anonymous vs. 5,000/hour with a token

No database is required — all configuration is stored in a local JSON file.

## Running it locally

Two terminals, from the repo root:

**Backend**
```bash
cd src/DeploymentAPI
dotnet run
```
Starts on `http://localhost:5279`.

**Frontend**
```bash
cd deployment-ui
npm install
npm run dev
```
Starts on `http://localhost:5173`. Its dev server proxies `/api/*` to the backend
(configured in `deployment-ui/vite.config.js`), so open **http://localhost:5173** —
not the backend port — in your browser.

### First-run configuration

You don't need to hand-edit any config file to get started. Open the app, go to
**Settings**, and fill in:

- **GitHub Credentials** — repository URL (`https://github.com/owner/repo`) and, optionally,
  a Personal Access Token
- **GitHub OAuth Login** *(optional)* — client ID/secret from a
  [GitHub OAuth App](https://github.com/settings/developers) if you want team members to
  log in with GitHub instead of using the portal anonymously. Set the app's callback URL to
  `http://localhost:5279/api/auth/github/callback`
- **Admin Allowlist** *(optional)* — GitHub usernames that should get the Admin role on login

These are written to `src/DeploymentAPI/appsettings.Local.json`, which is gitignored —
nothing you enter here ever gets committed.

## Running it with Docker

```bash
cp .env.example .env   # fill in GITHUB_OWNER / GITHUB_REPOSITORY / GITHUB_PAT
docker compose up --build
```
Frontend on `http://localhost:8081`, backend on `http://localhost:8080` (internal).
Settings saved through the UI persist in the bind-mounted
`src/DeploymentAPI/appsettings.Local.json`, so they survive a rebuild.

## Troubleshooting

**"Repository not found" / "Failed to save GitHub settings" even though everything looks
right** — the Vite dev server's proxy occasionally goes stale (most often after switching
git branches while it's running) and starts serving the frontend's own `index.html` instead
of forwarding `/api/*` to the backend. Stop the `npm run dev` process and start it again.

**Backend port already in use** — check for a lingering process
(`tasklist /FI "IMAGENAME eq DeploymentAPI.exe"` on Windows) and stop it before running
`dotnet run` again; the previous process holds a file lock that makes rebuilds fail.

**GitHub API errors like "rate limit exceeded"** — add a Personal Access Token in Settings
to raise the limit from 60 to 5,000 requests/hour.
