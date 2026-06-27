#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_PATH="${1:?missing deploy path}"
TARGET_SHA="${2:?missing target commit SHA}"
DEPLOY_BRANCH="${3:-main}"
SERVICE_NAME="${4:-tgxx-portal}"

log() {
    printf '[deploy] %s\n' "$*"
}

if [[ ! -d "$DEPLOY_PATH/.git" ]]; then
    printf '[deploy] ERROR: %s is not an initialized Git repository.\n' "$DEPLOY_PATH" >&2
    printf '[deploy] Run deploy/bootstrap-aliyun.sh on the server first.\n' >&2
    exit 1
fi

cd "$DEPLOY_PATH"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    printf '[deploy] ERROR: tracked files on the server have local changes; refusing to overwrite them.\n' >&2
    git status --short >&2
    exit 1
fi

log "fetching ${DEPLOY_BRANCH}"
git fetch --prune origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git merge --ff-only "$TARGET_SHA"

if [[ "$(git rev-parse HEAD)" != "$TARGET_SHA" ]]; then
    printf '[deploy] ERROR: checked-out commit does not match %s.\n' "$TARGET_SHA" >&2
    exit 1
fi

log 'updating Python environment'
python3 -m venv .venv
.venv/bin/python -m pip install --disable-pip-version-check --upgrade pip
.venv/bin/python -m pip install --disable-pip-version-check -r requirements.txt
.venv/bin/python -m py_compile app.py

if [[ "$(id -u)" -eq 0 ]]; then
    SYSTEMCTL=(systemctl)
else
    SYSTEMCTL=(sudo -n systemctl)
fi

log "restarting ${SERVICE_NAME}.service"
"${SYSTEMCTL[@]}" restart "${SERVICE_NAME}.service"
"${SYSTEMCTL[@]}" is-active --quiet "${SERVICE_NAME}.service"

log 'waiting for health check'
for attempt in {1..15}; do
    if .venv/bin/python - <<'PY'
from urllib.request import urlopen

with urlopen("http://127.0.0.1:8080/health", timeout=2) as response:
    if response.status != 200:
        raise SystemExit(1)
PY
    then
        log "deployment succeeded at ${TARGET_SHA}"
        exit 0
    fi
    sleep 2
done

printf '[deploy] ERROR: service did not pass /health within 30 seconds.\n' >&2
"${SYSTEMCTL[@]}" status "${SERVICE_NAME}.service" --no-pager >&2 || true
exit 1
