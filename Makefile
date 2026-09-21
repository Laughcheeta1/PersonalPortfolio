.PHONY: run frontend backend build test

NX_SERVE_ENV := NX_TUI=false NX_DEFAULT_OUTPUT_STYLE=stream NX_STREAM_OUTPUT=true NX_PREFIX_OUTPUT=true NX_NATIVE_COMMAND_RUNNER=false
NX_SERVE_FLAGS := --output-style=stream --parallel=2

run:
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	$(NX_SERVE_ENV) pnpm exec nx run-many --target=serve --projects=frontend,backend $(NX_SERVE_FLAGS)

frontend:
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	$(NX_SERVE_ENV) pnpm exec nx run frontend:serve --output-style=stream

backend:
	$(NX_SERVE_ENV) pnpm exec nx run backend:serve --output-style=stream

build:
	pnpm exec nx run frontend:build

test:
	pnpm exec nx run-many --target=test --projects=frontend,backend --parallel=2
