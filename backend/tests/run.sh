#!/bin/sh
# End-to-end tests of the real application (every module) against a throwaway PostgreSQL.
#
#   npm test                        run every suite
#   npm test -- notifications oauth run only these suites (file names in tests/e2e, without .e2e.ts)
#
# Needs Docker (one disposable postgres:16 container, removed at the end) and the backend's dependencies (`npm ci`).
# Each suite gets its own empty database with every migration applied, and its own folder for uploaded files, so
# nothing touches your real data. Nothing is published except one local port (TEST_DB_PORT, default 55432).
set -u
cd "$(dirname "$0")/.."

PORT="${TEST_DB_PORT:-55432}"
NAME="ft-transcendence-test-db-$$"
UPLOADS="$(mktemp -d)"
FAILED=""
PASSED=0

cleanup() {
  docker stop "$NAME" >/dev/null 2>&1
  rm -rf "$UPLOADS"
}
trap cleanup EXIT INT TERM

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is needed to start the test database." >&2
  exit 2
fi

echo "==> Starting a throwaway PostgreSQL on port $PORT"
docker run -d --rm --name "$NAME" -e POSTGRES_PASSWORD=t -e POSTGRES_USER=t -e POSTGRES_DB=postgres -p "$PORT:5432" postgres:16 >/dev/null || exit 2
i=0
until docker exec "$NAME" pg_isready -U t >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && { echo "The test database did not start." >&2; exit 2; }
  sleep 1
done
sleep 2

if [ "$#" -gt 0 ]; then
  SUITES="$*"
else
  SUITES="$(ls tests/e2e/*.e2e.ts | sed 's#.*/##; s#\.e2e\.ts$##')"
fi

for suite in $SUITES; do
  file="tests/e2e/$suite.e2e.ts"
  if [ ! -f "$file" ]; then
    echo "No such suite: $suite" >&2
    FAILED="$FAILED $suite"
    continue
  fi
  db="t_$(echo "$suite" | tr '-' '_')"
  docker exec "$NAME" psql -U t -d postgres -qc "create database $db" >/dev/null
  export DATABASE_URL="postgresql://t:t@localhost:$PORT/$db"
  npx prisma migrate deploy >/dev/null 2>&1 || { echo "migrations failed for $suite" >&2; FAILED="$FAILED $suite"; continue; }

  echo ""
  echo "==> $suite"
  out="$(UPLOADS_DIR="$UPLOADS/$suite" JWT_SECRET=test npx tsx "$file" 2>&1)"
  status=$?
  # the suites print one PASS / FAIL line per check; keep those, and anything that explains a crash
  echo "$out" | grep -E '^(PASS|FAIL|ALL PASSED|[0-9]+ FAILED|   \()' 
  if [ "$status" -ne 0 ]; then
    echo "$out" | grep -vE '^(PASS|FAIL|ALL PASSED|[0-9]+ FAILED|   \()|ExperimentalWarning|trace-warnings|^\{"level"|^prisma:' | tail -15
    FAILED="$FAILED $suite"
  else
    PASSED=$((PASSED + 1))
  fi
done

echo ""
if [ -z "$FAILED" ]; then
  echo "==> All $PASSED suites passed"
  exit 0
fi
echo "==> Failed:$FAILED"
exit 1
