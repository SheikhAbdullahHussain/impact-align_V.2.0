# Docker

- `docker-compose.dev.yml` — MongoDB 8 + Redis 7 for local development (ports bound to 127.0.0.1, credentials from `.env`).
- `docker-compose.apps.yml` — optional: also run the API, web and admin in containers.
- `Dockerfile.api`, `Dockerfile.next` — multi-stage, non-root production images.

Start the data stores: `npm run dev:infra` (needs `.env`). **Note:** these files have not been executed in the
environment where Phase 1 was produced (no Docker available) — verify with `docker compose config` and a first build.
