# ImpactAlign SDG

AI-assisted platform that connects activities and evidence to the SDGs
(**Goal → Target → Indicator → Evidence → Impact → Validation → Accreditation**), with human validation.
Methodology: **Diagnose → Align → Measure → Validate → Improve**.

> **Status: Phase 1 — project foundation.** No authentication, dashboards or SDG content yet.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Node.js 22 · Express 5 · MongoDB (Mongoose) · Redis ·
Zod · Vitest · Docker · GitHub Actions. See [ADR-001](docs/decisions/ADR-001-initial-architecture.md).

## Quick start

```bash
nvm use                    # Node 22
cp .env.example .env       # placeholders only; never commit .env
npm ci
npm run dev:infra          # MongoDB + Redis in Docker (127.0.0.1 only)
npm run build:packages     # shared packages must be built once (and after changing them)
npm run dev:api            # http://localhost:4000/health
npm run dev:web            # http://localhost:3000
npm run dev:admin          # http://localhost:3001
```

Check the API:

```bash
curl localhost:4000/health            # liveness
curl localhost:4000/health/database   # 200 when MongoDB is reachable, otherwise 503
curl localhost:4000/health/redis      # 200 when Redis is reachable, otherwise 503
```

Validate your environment without starting anything: `npm run check:env`.

## Commands

| Command                                      | What it does                                              |
| -------------------------------------------- | --------------------------------------------------------- |
| `npm run lint`                               | ESLint (zero warnings allowed)                            |
| `npm run format:check`                       | Prettier check (`npm run format` to fix)                  |
| `npm run typecheck`                          | Builds shared packages, then type-checks every workspace  |
| `npm test`                                   | Builds shared packages, then runs every workspace's tests |
| `npm run build`                              | Builds packages, then the API, web and admin              |
| `npm run dev:infra[:down]`                   | Start/stop local MongoDB and Redis                        |
| `npm run openapi:export -w @impactalign/api` | Regenerate `docs/api/openapi.json`                        |

## Layout

See [`docs/architecture/folder-structure.md`](docs/architecture/folder-structure.md) for the structure and the
architectural rules (dependency direction, no duplicated business logic, shared types/validation).

## Documentation

- [System architecture](docs/architecture/system-architecture.md)
- [Security architecture](docs/security/security-architecture.md) · [SECURITY.md](SECURITY.md)
- [Product overview](docs/product/product-overview.md)
- [ADR-001](docs/decisions/ADR-001-initial-architecture.md)
- [API docs](docs/api/README.md) · [Privacy](docs/privacy/README.md) · [Deployment notes](infrastructure/deployment/README.md)

Contributing: [CONTRIBUTING.md](CONTRIBUTING.md). Licence: placeholder, see [LICENSE](LICENSE).

# impact-align_V.2.0

# impact-align_V.2.0
