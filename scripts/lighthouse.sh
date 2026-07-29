#!/usr/bin/env bash
#
# Performance budget run (D6, BUILD-PHASE-5 gate #9).
#
# Lighthouse measures two URLs: the marketing home page and /crew. Measuring
# /crew anonymously only profiles the access gate — a near-empty page — which
# would make the budget look green while telling us nothing about the app the
# child actually uses. So this script signs in as the seeded test family,
# mints a real child session, and hands the crew token to Lighthouse as a
# cookie. The build must already exist (pnpm build).
#
# Used by CI and runnable locally: pnpm perf
set -euo pipefail

PORT=3100
BASE="http://localhost:${PORT}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAR="$(mktemp)"
SERVER_PID=""

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  rm -f "$JAR"
}
trap cleanup EXIT

echo "→ starting production server on :${PORT}"
(cd "$ROOT" && pnpm --filter @cluecrew/web start >/tmp/lighthouse-server.log 2>&1) &
SERVER_PID=$!

for _ in $(seq 1 60); do
  curl -sf "${BASE}/api/health" >/dev/null 2>&1 && break
  sleep 2
done
if ! curl -sf "${BASE}/api/health" >/dev/null 2>&1; then
  echo "✗ server did not become healthy; last log lines:" >&2
  tail -20 /tmp/lighthouse-server.log >&2
  exit 1
fi

echo "→ minting a child session so /crew is measured as the real child app"
CSRF="$(curl -s -c "$JAR" "${BASE}/api/auth/csrf" | node -pe 'JSON.parse(require("fs").readFileSync(0)).csrfToken')"
curl -s -b "$JAR" -c "$JAR" -o /dev/null \
  -X POST "${BASE}/api/auth/callback/credentials" \
  --data-urlencode "csrfToken=${CSRF}" \
  --data-urlencode "email=${PERF_PARENT_EMAIL:-test-family@cluecrew.test}" \
  --data-urlencode "password=${PERF_PARENT_PASSWORD:-CrewTest!2026}"

CHILD_ID="$(curl -s -b "$JAR" "${BASE}/api/parent/children" \
  | node -pe 'const r=JSON.parse(require("fs").readFileSync(0)); (r.children&&r.children[0]&&r.children[0].id)||""')"
if [ -z "$CHILD_ID" ]; then
  echo "✗ could not read a child profile — is the database seeded?" >&2
  exit 1
fi

curl -s -b "$JAR" -c "$JAR" -o /dev/null \
  -X POST "${BASE}/api/child-session" \
  -H 'Content-Type: application/json' \
  --data "{\"childId\":\"${CHILD_ID}\"}"

CREW_TOKEN="$(awk '$6=="crew_token" {print $7}' "$JAR" | tail -1)"
if [ -z "$CREW_TOKEN" ]; then
  echo "✗ no crew_token minted — /crew would only measure the access gate" >&2
  exit 1
fi
echo "  ✓ child session ready (${CHILD_ID})"

echo "→ running Lighthouse CI"
cd "$ROOT/apps/web"
pnpm dlx @lhci/cli@0.14.x autorun \
  --config="${ROOT}/.lighthouserc.json" \
  --collect.settings.extraHeaders="{\"Cookie\":\"crew_token=${CREW_TOKEN}\"}"
