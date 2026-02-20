.PHONY: ensure_docker dev

ensure_docker:
	@docker ps >/dev/null 2>&1 || { echo "Docker not running, please start it"; exit 1; }

dev: ensure_docker
	nx dev PersonalPortfolio
