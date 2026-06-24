# mlorente.dev — frontend (Astro). The app lives in site/.
# Code here; K8s manifests + deploy live in the kubelab platform repo (ADR-053).
.DEFAULT_GOAL := help
SITE := site

.PHONY: help install dev build preview docker-build clean

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-13s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	cd $(SITE) && npm install

dev: ## Run the Astro dev server (no cluster needed)
	cd $(SITE) && npm run dev

build: ## Production build (astro check && astro build)
	cd $(SITE) && npm run build

preview: ## Preview the production build locally
	cd $(SITE) && npm run preview

docker-build: ## Build the production image locally (same Dockerfile as CI)
	docker build -t kubelab-web:local .

clean: ## Remove build output and installed deps
	rm -rf $(SITE)/dist $(SITE)/node_modules
