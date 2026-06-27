#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY_URL="${1:?usage: bootstrap-aliyun.sh <repository-url> [deploy-path] [branch] [service-name]}"
DEPLOY_PATH="${2:-/opt/tgxx-portal}"
DEPLOY_BRANCH="${3:-main}"
SERVICE_NAME="${4:-tgxx-portal}"
DEPLOY_USER="${SUDO_USER:-$USER}"
DEPLOY_GROUP="$(id -gn "$DEPLOY_USER")"

if [[ "$(id -u)" -eq 0 ]]; then
    SUDO=()
else
    SUDO=(sudo)
fi

for command in git python3; do
    if ! command -v "$command" >/dev/null 2>&1; then
        printf 'ERROR: %s is required. Install Git and Python 3 first.\n' "$command" >&2
        exit 1
    fi
done

if [[ ! -d "$DEPLOY_PATH/.git" ]]; then
    "${SUDO[@]}" mkdir -p "$DEPLOY_PATH"
    "${SUDO[@]}" chown "$DEPLOY_USER:$DEPLOY_GROUP" "$DEPLOY_PATH"
    git clone --branch "$DEPLOY_BRANCH" "$REPOSITORY_URL" "$DEPLOY_PATH"
fi

cd "$DEPLOY_PATH"
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt

APP_SECRET_KEY="$(.venv/bin/python -c 'import secrets; print(secrets.token_urlsafe(48))')"
if [[ ! -f .env ]]; then
    umask 077
    printf 'APP_ENV=production\nAPP_SECRET_KEY=%s\n' "$APP_SECRET_KEY" > .env
fi

SERVICE_TMP="$(mktemp)"
trap 'rm -f "$SERVICE_TMP"' EXIT
sed \
    -e "s|__DEPLOY_USER__|$DEPLOY_USER|g" \
    -e "s|__DEPLOY_GROUP__|$DEPLOY_GROUP|g" \
    -e "s|__DEPLOY_PATH__|$DEPLOY_PATH|g" \
    deploy/tgxx-portal.service.example > "$SERVICE_TMP"

"${SUDO[@]}" install -m 0644 "$SERVICE_TMP" "/etc/systemd/system/${SERVICE_NAME}.service"
"${SUDO[@]}" systemctl daemon-reload
"${SUDO[@]}" systemctl enable --now "${SERVICE_NAME}.service"
"${SUDO[@]}" systemctl is-active --quiet "${SERVICE_NAME}.service"

printf 'Bootstrap complete. Deployment path: %s; service: %s.service\n' "$DEPLOY_PATH" "$SERVICE_NAME"
