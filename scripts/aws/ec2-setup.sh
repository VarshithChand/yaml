#!/bin/bash
set -euo pipefail

# Bootstraps a fresh Amazon Linux 2023 EC2 instance to run the Deployment
# Portal via Docker Compose, pulling pre-built images from GHCR (see
# docker-compose.prod.yml and .github/workflows/Docker Build and Push.yml)
# instead of building from source on the instance itself.
#
# Use it either as EC2 "User data" at launch (runs automatically as root
# on first boot), or by SSHing in and running it manually:
#
#   curl -fsSL https://raw.githubusercontent.com/VarshithChand/yaml/master/scripts/aws/ec2-setup.sh | sudo bash
#
# Idempotent — safe to re-run (e.g. after editing .env) to pull the latest
# images and restart.

APP_DIR="/opt/deployment-portal"
COMPOSE_URL="https://raw.githubusercontent.com/VarshithChand/yaml/master/docker-compose.prod.yml"

echo "==> Installing Docker"
dnf update -y
dnf install -y docker
systemctl enable --now docker

# Amazon Linux 2023's docker package doesn't bundle the Compose plugin —
# install it directly from Docker's own release, matching how `docker
# compose` (the modern subcommand form, not the old standalone
# docker-compose binary) expects to be installed.
if ! docker compose version >/dev/null 2>&1; then
  echo "==> Installing the Docker Compose plugin"
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# Lets the default ec2-user run docker/docker compose without sudo —
# only takes effect on their *next* login shell, which is why the rest of
# this script still runs as root.
usermod -aG docker ec2-user || true

echo "==> Setting up $APP_DIR"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

curl -fsSL "$COMPOSE_URL" -o docker-compose.prod.yml

if [ ! -f .env ]; then
  echo "==> Writing a .env template — EDIT THIS before the app will work correctly"
  cat > .env <<'EOF'
GITHUB_OWNER=your-github-org-or-user
GITHUB_REPOSITORY=your-repo-name
GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EOF
  echo ""
  echo "############################################################"
  echo "# $APP_DIR/.env was just created with placeholder values.  #"
  echo "# Edit it with your real GitHub repo + PAT, then run:      #"
  echo "#   cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d"
  echo "############################################################"
  echo ""
else
  echo "==> .env already exists, leaving it as-is"
fi

echo "==> Pulling images and starting the stack"
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

echo "==> Done. Check status with: docker compose -f $APP_DIR/docker-compose.prod.yml ps"
