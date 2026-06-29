#!/bin/bash
# benchmark/docker_bench.sh — Docker-based SSR benchmark: QJS vs goja vs Node.js
#
# Prereqs: example.pack must be built (see build-pack skill)
#          For node-ssr: examples/example must be built with pnpm build
#
# Usage: ./benchmark/docker_bench.sh [--skip-node] [--skip-goja]
# Env overrides:
#   BENCH_DURATION   wrk duration, default 30s
#   BENCH_CONNS      concurrent connections, default 32
#   BENCH_THREADS    wrk threads, default 4
#   BENCH_PATH       URL path to benchmark, default /
set -euo pipefail

DURATION="${BENCH_DURATION:-30s}"
CONNS="${BENCH_CONNS:-32}"
THREADS="${BENCH_THREADS:-4}"
BENCH_PATH="${BENCH_PATH:-/}"

SKIP_NODE=0
SKIP_GOJA=0
for arg in "$@"; do
  case "$arg" in
    --skip-node) SKIP_NODE=1 ;;
    --skip-goja) SKIP_GOJA=1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.bench.yml"
PROJECT="astro-bench"
QJS_PORT="18081"
NODE_PORT="18082"
GOJA_PORT="18083"

die() { echo "ERROR: $*" >&2; exit 1; }

# Check example.pack exists
PACK="$SCRIPT_DIR/../integration/testdata/example/example.pack"
[ -f "$PACK" ] || die "example.pack not found — run build-pack skill first"

# ── build & start ─────────────────────────────────────────────────────────────
echo "=== Building images ==="
SERVICES="astro-runtime-qjs"
[ "$SKIP_GOJA" -eq 0 ] && SERVICES="$SERVICES astro-runtime-goja"
[ "$SKIP_NODE" -eq 0 ] && SERVICES="$SERVICES node-ssr"
docker compose -f "$COMPOSE_FILE" -p "$PROJECT" build $SERVICES

echo ""
echo "=== Starting services ==="
docker compose -f "$COMPOSE_FILE" -p "$PROJECT" up -d $SERVICES

echo ""
echo "Waiting for services to become healthy..."
for svc in astro-runtime-qjs $([ "$SKIP_GOJA" -eq 0 ] && echo astro-runtime-goja) $([ "$SKIP_NODE" -eq 0 ] && echo node-ssr); do
  container=$(docker compose -f "$COMPOSE_FILE" -p "$PROJECT" ps -q "$svc" 2>/dev/null || true)
  [ -z "$container" ] && continue
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
  local label="$1" url="$2"
  echo ""
  echo "══════════════════════════════════════════════"
  echo " $label"
  echo " URL: $url"
  echo "══════════════════════════════════════════════"

  if command -v wrk &>/dev/null; then
    wrk -t"$THREADS" -c"$CONNS" -d"$DURATION" "$url"
  elif command -v bombardier &>/dev/null; then
    bombardier -c "$CONNS" -d "$DURATION" "$url"
  elif command -v hey &>/dev/null; then
    hey -c "$CONNS" -z "$DURATION" "$url"
  elif command -v ab &>/dev/null; then
    ab -n 5000 -c "$CONNS" "$url" \
      | grep -E "Requests per second|Time per request \(mean\)|Failed requests"
  else
    die "no HTTP benchmark tool found — install wrk, bombardier, hey, or ab"
  fi
}

# ── benchmarks ────────────────────────────────────────────────────────────────
echo ""
echo "Benchmarking path: ${BENCH_PATH}"

run_bench "astro-runtime (QJS / QuickJS+WASM)" "http://localhost:${QJS_PORT}${BENCH_PATH}"

if [ "$SKIP_GOJA" -eq 0 ]; then
  run_bench "astro-runtime (goja / pure-Go)" "http://localhost:${GOJA_PORT}${BENCH_PATH}"
fi

if [ "$SKIP_NODE" -eq 0 ]; then
  run_bench "Node.js (V8)" "http://localhost:${NODE_PORT}${BENCH_PATH}"
fi

# ── cleanup ───────────────────────────────────────────────────────────────────
echo ""
echo "=== Done. Stopping services ==="
docker compose -f "$COMPOSE_FILE" -p "$PROJECT" down
