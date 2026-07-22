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

Frontend on **http://localhost:8081**, backend on `http://localhost:8080` (internal only) —
both containers sit on the same `portal-network` Docker network and reach each other by
service name (nginx proxies `/api/*` to `http://deployment-api:8080`). The frontend waits
for the backend's healthcheck to actually pass before it starts serving, so there's no
race where it comes up before the API is ready to answer. Settings saved through the UI
persist in the bind-mounted `src/DeploymentAPI/data/` directory, so they survive a rebuild.

---

## 5. Pull the pre-built images instead (no clone, no build)

Every push to `master` that touches the frontend or backend builds and publishes both
images to GitHub Container Registry via
[`.github/workflows/Docker Build and Push.yml`](.github/workflows/Docker%20Build%20and%20Push.yml):

- `ghcr.io/varshithchand/deployment-portal-api`
- `ghcr.io/varshithchand/deployment-portal-ui`

This is the fastest way to run the portal on a machine that has never seen this repo —
a fresh cloud VM, a teammate's laptop, anywhere Docker is installed.

### 5a. If the packages are private (the default)

GHCR packages pushed by a workflow default to private. Either flip both to **Public** from
each package's **Package settings** on GitHub (then anyone can `docker pull` with no login),
or log in first with a [Personal Access Token](https://github.com/settings/tokens) that has
the `read:packages` scope:

```bash
docker login ghcr.io -u YOUR_GITHUB_USERNAME -p YOUR_PAT_WITH_read_packages_SCOPE
```

### 5b. Run them with Compose

Grab just this one file — [`docker-compose.prod.yml`](docker-compose.prod.yml) — no other
part of the repo is needed:

```bash
curl -O https://raw.githubusercontent.com/VarshithChand/yaml/master/docker-compose.prod.yml
```

Next to it, create a `.env`:
```
GITHUB_OWNER=your-github-org-or-user
GITHUB_REPOSITORY=your-repo-name
GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then:
```bash
docker compose -f docker-compose.prod.yml up -d
```

Same result as [section 4](#4-run-it-with-docker-instead) — frontend on
**http://localhost:8081**, backend reachable internally at `deployment-api:8080` on the
`portal-network` bridge network — except Docker pulls both images from GHCR instead of
building them from source, and settings persist in a named `deployment-data` volume instead
of a bind-mounted folder.

### 5c. Or run them by hand, no compose file at all

```bash
docker network create portal-network

docker run -d --name deployment-api --network portal-network \
  -e GitHub__Owner=your-github-org-or-user \
  -e GitHub__Repository=your-repo-name \
  -e GitHub__PersonalAccessToken=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  -v deployment-data:/data \
  ghcr.io/varshithchand/deployment-portal-api:latest

docker run -d --name deployment-ui --network portal-network \
  -p 8081:80 \
  ghcr.io/varshithchand/deployment-portal-ui:latest
```

Both containers land on the same `portal-network`, so nginx inside `deployment-ui` still
reaches `http://deployment-api:8080` by container name — exactly what Compose sets up
automatically in 5b, just spelled out by hand.

### On a cloud VM

The exact same commands from 5b or 5c work unchanged on a fresh VM on any provider — AWS
EC2, DigitalOcean, Azure, GCP, whatever — as long as Docker is installed and port **8081**
is open in that provider's firewall/security group. Then open
`http://YOUR_VM_PUBLIC_IP:8081`.

---

## 6. Deploying it for free (Fly.io + Cloudflare Pages)

The backend goes on **Fly.io** (free allowance includes a small persistent volume, so
saved Settings survive redeploys) and the frontend on **Cloudflare Pages** (free static
hosting). Since they end up on different domains, this isn't quite the same as local dev —
the frontend needs to know the backend's absolute URL at build time, and the two host
setup steps below (`fly deploy`, then the Pages dashboard) each depend on output from the
other, so do them in order.

### 6a. Deploy the backend to Fly.io

Install the CLI:
```bash
# Windows (PowerShell)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# macOS / Linux
curl -L https://fly.io/install.sh | sh
```

Log in (opens a browser):
```bash
fly auth login
```

`src/DeploymentAPI/fly.toml` is already set up (Docker build, persistent volume mounted
at `/data`, port 8080 matching the Dockerfile). Pick a globally-unique app name, put it in
that file's `app = "..."` line, then:

```bash
cd src/DeploymentAPI

fly apps create YOUR-UNIQUE-APP-NAME

fly volumes create deployment_data --region iad --size 1 -a YOUR-UNIQUE-APP-NAME

# a real signing secret for login sessions — without this the app still
# runs (it generates one on its own), but sessions won't survive a restart
fly secrets set Jwt__Secret="$(openssl rand -base64 32)" -a YOUR-UNIQUE-APP-NAME

fly deploy -a YOUR-UNIQUE-APP-NAME
```

Confirm it's up:
```bash
curl https://YOUR-UNIQUE-APP-NAME.fly.dev/api/settings
```
should return an empty settings JSON, not an error.

### 6b. Deploy the frontend to Cloudflare Pages

This part's dashboard-only (Cloudflare doesn't have a "one command" path for a fresh
project). At [dash.cloudflare.com](https://dash.cloudflare.com/) → **Workers & Pages** →
**Create** → **Pages** → **Connect to Git** → pick this repo, then set:

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | `deployment-ui` |
| Build command | `npm run build` |
| Build output directory | `dist` |

Under **Environment variables**, add:
```
VITE_API_BASE_URL = https://YOUR-UNIQUE-APP-NAME.fly.dev
```
(no trailing slash) — this is what makes the built frontend call your Fly.io backend
instead of expecting a same-origin `/api/*`. Save and deploy; Cloudflare gives you a
`https://your-project.pages.dev` URL.

### 6c. Point the backend's CORS at the new frontend URL

Back in a terminal:
```bash
fly secrets set Cors__AllowedOrigins__0=https://your-project.pages.dev -a YOUR-UNIQUE-APP-NAME
```
(Setting a secret restarts the app automatically.) If you later add a custom domain in
Cloudflare, add it too as `Cors__AllowedOrigins__1`, and so on.

Open the `pages.dev` URL — first-run configuration works exactly as in
[section 3](#first-run-configuration), except settings now persist on the Fly.io volume
across redeploys instead of a local file.

**Using GitHub OAuth login in this setup** *(optional)* — the callback/frontend URLs for
OAuth aren't editable from the Settings page, only via config, so also set:
```bash
fly secrets set GitHubOAuth__CallbackUrl=https://YOUR-UNIQUE-APP-NAME.fly.dev/api/auth/github/callback \
                GitHubOAuth__FrontendUrl=https://your-project.pages.dev \
                -a YOUR-UNIQUE-APP-NAME
```
and set your GitHub OAuth App's callback URL to match the first value.

---

## 7. Running the sample services (optional)

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

**Deployed on Fly.io/Cloudflare Pages and API calls fail with a CORS error** — the backend
only allows origins listed in `Cors:AllowedOrigins`; confirm you ran the `fly secrets set
Cors__AllowedOrigins__0=...` step in [6c](#6c-point-the-backends-cors-at-the-new-frontend-url)
with your actual `pages.dev` URL (or custom domain).

**Deployed, but "Login with GitHub" doesn't keep you logged in** — this needs
`GitHubOAuth__CallbackUrl`/`GitHubOAuth__FrontendUrl` set to your real URLs (see the OAuth
note at the end of section 6), and it only works over HTTPS, which both Fly.io and
Cloudflare Pages give you by default — plain PAT-based usage doesn't need any of this.
