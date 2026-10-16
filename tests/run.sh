#!/usr/bin/env bash
# Local gate: undefined_calls + WebKit smoke against a temp static server. Target <30s.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${FLATS_TEST_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/"

if [[ ! -d tests/node_modules/playwright ]]; then
  echo "tests/run.sh: installing playwright…"
  (cd tests && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-fund --no-audit playwright@1.64.0)
  (cd tests && npx playwright install webkit >/dev/null)
fi

echo "tests/run.sh: undefined_calls"
node tests/undefined_calls.mjs

# free port if stale
if command -v fuser >/dev/null 2>&1; then fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true; fi

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/tmp/flats-test-http.log 2>&1 &
PID=$!
cleanup() { kill "$PID" >/dev/null 2>&1 || true; }
trap cleanup EXIT

for i in $(seq 1 50); do
  if curl -sf -o /dev/null "$URL"; then break; fi
  sleep 0.1
done

echo "tests/run.sh: smoke $URL"
node tests/smoke.mjs "$URL"
echo "tests/run.sh: OK"
