.PHONY: deps build docker-up docker-down test clean

ASTRO_RUNTIME = go run ../../../astro-runtime/cmd/main.go
GO_BUILD_DIR  = ../..

deps:
	pnpm install

build: deps
	cd $(GO_BUILD_DIR) && go build -o /tmp/astro-runtime ./cmd
	/tmp/astro-runtime build \
		--entry src/entry.jsx \
		--kind react \
		--out bundle.mjs
	@echo "bundle.mjs: $$(du -sh bundle.mjs | cut -f1)"

docker-up: build
	docker compose up --build -d
	@echo "waiting for server..."
	@sleep 3
	@curl -s http://localhost:8081/health && echo ""
	@echo "React 18 SSR running at http://localhost:8081"

docker-down:
	docker compose down

test:
	@echo "=== /health ==="
	@curl -s http://localhost:8081/health
	@echo "\n=== /api/products ==="
	@curl -s http://localhost:8081/api/products
	@echo "\n=== / (HTML head) ==="
	@curl -s http://localhost:8081/ | head -20

clean:
	rm -f bundle.mjs
	docker compose down --rmi local 2>/dev/null || true
