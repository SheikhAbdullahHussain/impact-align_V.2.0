# @impactalign/api

Express 5 + TypeScript REST API. Phase 1 exposes only the health endpoints.

- `src/app.ts` — builds the Express app from injected dependencies (testable without a network).
- `src/main.ts` — process bootstrap: env validation, MongoDB/Redis connections, graceful shutdown.
- `src/common/` — logger, error envelope, request helpers. `src/health/` — health router + service.
- `src/infrastructure/` — MongoDB (background retry) and Redis clients.
- `src/openapi/` — OpenAPI document.

Run: `npm run dev -w @impactalign/api` (needs `.env`, see repo root). Feature folders are added in Phase 2.
