#!/bin/bash
# benchmark/docker_bench.sh — Docker-based SSR benchmark: astro-runtime vs Node.js
# Usage: ./benchmark/docker_bench.sh
# Env overrides:
#   BENCH_DURATION   wrk duration, default 30s
#   BENCH_CONNS      concurrent connections, default 32
#   BENCH_THREADS    wrk threads, default 4
#   BENCH_REQUESTS   ab total requests (when using ab), default 5000
#   BENCH_PATH       URL path to benchmark, default /api/products
set -euo pipefail

DURATION="${BENCH_DURATION:-30s}"
CONNS="${BENCH_CONNS:-32}"
THREADS="${BENCH_THREADS:-4}"
REQUESTS="${BENCH_REQUESTS:-5000}"
BENCH_PATH="${BENCH_PATH:-/api/products}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.bench.yml"
PROJECT="astro-bench"
ASTRO_PORT="18081"
NODE_PORT="18082"

die() { echo "ERROR: $*" >&2; exit 1; }

# ── build & start ─────────────────────────────────────────────────────────────
echo "=== Building images ==="
docker compose -f "$COMPOSE_FILE" -p "$PROJECT" build

echo ""
echo "=== Starting services ==="
docker compose -f "$COMPOSE_FILE" -p "$PROJECT" up -d

echo ""
echo "Waiting for services to become healthy..."
for svc in astro-runtime node-ssr; do
  container=$(docker compose -f "$COMPOSE_FILE" -p "$PROJECT" ps -q "$svc")
  for i in $(seq 1 60); do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
      echo "  ✓ $svc healthy"
      break
    fi
    if [ "$i" -eq 60 ]; then
      echo "  ✗ $svc not healthy after 3m" >&2
      docker compose -f "$COMPOSE_FILE" -p "$PROJECT" logs "$svc" >&2
      docker compose -f "$COMPOSE_FILE" -p "$PROJECT" down
      exit 1
    fi
    sleep 3
  done
done

# ── pick benchmark tool ───────────────────────────────────────────────────────
run_bench() {
  local label="$1" host_url="$2" docker_url="$3"
  echo ""
  echo "──────────────────────────────────────────────"
  echo " $label"
  echo "──────────────────────────────────────────────"

  if command -v wrk &>/dev/null; then
    # wrk on host
    wrk -t"$THREADS" -c"$CONNS" -d"$DURATION" "${host_url}${BENCH_PATH}"

  elif command -v bombardier &>/dev/null; then
    bombardier -c "$CONNS" -d "$DURATION" "${host_url}${BENCH_PATH}"

  elif command -v ab &>/dev/null; then
    # apache bench (macOS built-in)
    ab -n "$REQUESTS" -c "$CONNS" "${host_url}${BENCH_PATH}" \
      | grep -E "Requests per second|Time per request \(mean\)|Failed requests"

  else
    # fallback: wrk via Docker (amd64 only)
    NET=$(docker network ls --filter "name=${PROJECT}_default" --format "{{.Name}}" | head -1)
    [ -n "$NET" ] || die "cannot find docker network"
    docker run --rm --network="$NET" williamyeh/wrk \
      -t"$THREADS" -c"$CONNS" -d"$DURATION" "${docker_url}${BENCH_PATH}"
  fi
}

# ── benchmarks ────────────────────────────────────────────────────────────────
echo ""
echo "=== astro-runtime (Go + QuickJS) ==="
run_bench "astro-runtime" "http://localhost:${ASTRO_PORT}" "http://astro-runtime:8080"

echo ""
echo "=== Node.js (V8) ==="
run_bench "Node.js (V8)" "http://localhost:${NODE_PORT}" "http://node-ssr:3001"

# ── cleanup ───────────────────────────────────────────────────────────────────
echo ""
echo "=== Done. Stopping services ==="
docker compose -f "$COMPOSE_FILE" -p "$PROJECT" down
