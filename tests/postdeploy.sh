#!/usr/bin/env bash
# After git push: wait for GitHub Pages, run live WebKit smoke. Loud on failure.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIVE="${FLATS_APP_URL:-https://gowritegrisha.github.io/london-flats-app/}"
WANT_VER="${FLATS_EXPECT_VER:-v4.9}"
MAX_WAIT="${FLATS_PAGES_WAIT:-120}"

echo "postdeploy: waiting for Pages ($LIVE) to serve $WANT_VER (max ${MAX_WAIT}s)…"
deadline=$((SECONDS + MAX_WAIT))
ok=0
while (( SECONDS < deadline )); do
  body="$(curl -fsSL -H 'Cache-Control: no-cache' "$LIVE" 2>/dev/null || true)"
  if grep -q "$WANT_VER" <<<"$body"; then ok=1; break; fi
  sleep 3
done
if (( ok == 0 )); then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  echo "POST-DEPLOY FAILED: Pages did not serve $WANT_VER within ${MAX_WAIT}s" >&2
  echo "URL: $LIVE" >&2
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  exit 1
fi

echo "postdeploy: live smoke $LIVE"
if ! node "$ROOT/tests/smoke.mjs" "$LIVE"; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  echo "POST-DEPLOY LIVE SMOKE FAILED" >&2
  echo "URL: $LIVE" >&2
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  exit 1
fi
echo "postdeploy: OK"
