#!/usr/bin/env bash
# Install repo pre-commit hook (make_lite + tests/run.sh).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-commit"
mkdir -p "$(dirname "$HOOK")"
cat > "$HOOK" <<'HOOK'
#!/bin/sh
cd "$(git rev-parse --show-toplevel)" || exit 1
python3 /workspace/rightmove-watch/make_lite.py >/dev/null 2>&1 && git add listings_lite.json photos/t rules.json 2>/dev/null
./tests/run.sh || { echo "pre-commit: tests/run.sh FAILED — commit aborted" >&2; exit 1; }
exit 0
HOOK
chmod +x "$HOOK"
echo "installed $HOOK"
