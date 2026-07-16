# GitHub Deployment Portal

An internal CI/CD dashboard for triggering, monitoring, and rolling back GitHub Actions
deployments — a React/Vite frontend backed by an ASP.NET Core API that talks to the
GitHub REST API on your behalf.

- `deployment-ui/` — React frontend (dashboard, deploy form, history, analytics, settings)
- `src/DeploymentAPI/` — ASP.NET Core backend (GitHub API integration, auth, settings storage)
- `src/AdminAPI/`, `src/PMSCoreAPI/`, `src/SecurityAPI/` — the sample services this portal deploys
- `.github/workflows/` — the CI/CD pipelines the portal triggers

No database is required — all configuration is stored in a local JSON file.

---

## 1. Install prerequisites

You need **.NET SDK 10** and **Node.js 20+**. Pick your OS below.

### Windows (PowerShell)

```powershell
winget install Microsoft.DotNet.SDK.10
winget install OpenJS.NodeJS.LTS
```

Close and reopen your terminal after installing, then confirm:

```powershell
dotnet --version
node --version
npm --version
```

### macOS

```bash
brew install --cask dotnet-sdk
brew install node
```

### Linux (Debian/Ubuntu)

```bash
wget https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh
chmod +x /tmp/dotnet-install.sh
/tmp/dotnet-install.sh --channel 10.0
echo 'export PATH="$HOME/.dotnet:$PATH"' >> ~/.bashrc && source ~/.bashrc

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

You'll also want [Git](https://git-scm.com/downloads) if you don't already have it, and
optionally a [Personal Access Token](https://github.com/settings/tokens) (scopes: `repo`,
`workflow`) — the portal works without one, but GitHub's API rate limit is 60 requests/hour
anonymous vs. 5,000/hour with a token.

---

## 2. Clone the repo

```bash
git clone https://github.com/VarshithChand/yaml.git
cd yaml
```

---

## 3. Run the Deployment Portal

Two terminals, both from the repo root.

**Terminal 1 — backend**
```bash
cd src/DeploymentAPI
dotnet restore
dotnet run
```
Starts on **http://localhost:5279**.

**Terminal 2 — frontend**
```bash
cd deployment-ui
npm install
npm run dev
```
Starts on **http://localhost:5173**. Its dev server proxies `/api/*` to the backend
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
- **Admin Allowlist** *(optional)* — GitHub usernames that should get the Admin role on login.
  Admin accounts (repo-admin on GitHub) are also the only ones who see the Release Approvals
  page, since that's the same permission GitHub itself requires to approve a deployment

These are written to `src/DeploymentAPI/appsettings.Local.json`, which is gitignored —
nothing you enter here ever gets committed.

---

## 4. Run it with Docker instead

One command, from the repo root:

```bash
cp .env.example .env
```

Open `.env` and fill in your repo details:
```
GITHUB_OWNER=your-github-org-or-user
GITHUB_REPOSITORY=your-repo-name
GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then build and start both containers:
```bash
docker compose up --build
```

Frontend on **http://localhost:8081**, backend on `http://localhost:8080` (internal only).
Settings saved through the UI persist in the bind-mounted
`src/DeploymentAPI/appsettings.Local.json`, so they survive a rebuild.

---

## 5. Running the sample services (optional)

`AdminAPI`, `PMSCoreAPI`, and `SecurityAPI` are the sample ASP.NET Core services this portal
deploys — you don't need them running to use the portal itself, but if you want to run one
locally:

```bash
cd src/AdminAPI      # or PMSCoreAPI / SecurityAPI
dotnet restore
dotnet run
```

| Service | URL |
|---|---|
| AdminAPI | http://localhost:5274 |
| PMSCoreAPI | http://localhost:5116 |
| SecurityAPI | http://localhost:5159 |
| DeploymentAPI | http://localhost:5279 |

To build everything in the repo at once instead of one project at a time:
```bash
dotnet build Demo-Patch-CICD.slnx
```

---

## Troubleshooting

**"Repository not found" / "Failed to save GitHub settings" even though everything looks
right** — the Vite dev server's proxy occasionally goes stale (most often after switching
git branches while it's running) and starts serving the frontend's own `index.html` instead
of forwarding `/api/*` to the backend. Stop the `npm run dev` process and start it again.

**Backend port already in use** — check for a lingering process
(`tasklist /FI "IMAGENAME eq DeploymentAPI.exe"` on Windows, `lsof -i :5279` on
macOS/Linux) and stop it before running `dotnet run` again; the previous process holds a
file lock that makes rebuilds fail.

**GitHub API errors like "rate limit exceeded"** — add a Personal Access Token in Settings
to raise the limit from 60 to 5,000 requests/hour.

**The Approvals page/tab isn't showing** — it's only visible to a token that has admin
access to the configured repo, since that's the permission GitHub requires to approve a
deployment. Check that the account behind your saved Personal Access Token is a repo admin.
