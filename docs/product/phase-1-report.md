# Phase 1 report — Project foundation

## Verification (fresh clone, CI sequence)

| Step                                      | Result                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `npm ci`                                  | pass                                                                       |
| `npm run format:check`                    | pass                                                                       |
| `npm run lint` (0 warnings)               | pass                                                                       |
| `npm run typecheck`                       | pass                                                                       |
| `npm test`                                | pass — 40 tests (config 11, validation 5, database 3, ui 4, api 14, web 3) |
| `npm run build`                           | pass — packages, API, web (22 routes), admin                               |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities                                                          |

Also verified by running the real processes: API health endpoints (200 / 503 with no detail leakage), live Redis
outage and automatic recovery, fail-fast env validation, web security headers + nonce CSP on a production
build, robots/sitemap, Husky pre-commit blocking `any`, and the API Docker runtime install simulated outside Docker.

## Database changes

None applied. `packages/database` defines one model (`AuditLog`, append-only at the Mongoose layer). MongoDB
creates collections/indexes on first use (index auto-build is disabled in production).

## Environment variables added

`NODE_ENV`, `LOG_LEVEL`, `API_HOST`, `API_PORT`, `API_CORS_ORIGINS`, `API_TRUST_PROXY`, `API_SWAGGER_ENABLED`,
`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `HEALTH_CHECK_TIMEOUT_MS`, `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`,
`REDIS_PASSWORD`, `MONGODB_URI`, `REDIS_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`.
Reserved but unused: SMTP, S3, LLM variables (commented in `.env.example`).

## Known limitations

1. **MongoDB not exercised live.** No `mongod` was available; `/health/database` is verified through tests and by
   its failure path only. Run `npm run dev:infra` and check `GET /health/database` returns 200.
2. **Docker files not built or run** (no Docker available). Run `docker compose ... config` and a first build.
3. **Dev-tooling audit findings:** `npm audit` (including dev dependencies) reports high-severity issues in the
   lint chain (`@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`). They do not ship at runtime;
   the CI audit checks production dependencies only.
4. Rate limiter is per-process (needs a Redis store before scaling out).
5. All web/admin pages render dynamically (required by the nonce CSP).
6. Brand tokens are proposed values; legal pages, LICENSE and the security contact are placeholders.
7. Vector search strategy (pgvector replacement) is undecided.
8. No browser/E2E or accessibility audit tooling yet; accessibility is addressed by semantic markup, skip link,
   labelled landmarks, `aria-current`, disclosure-pattern mobile menu, and `jsx-a11y` lint rules.

## Next recommended phase

**Phase 2 — Application architecture:** create the empty feature folders and READMEs for web/api/admin and
add the architectural-rule documentation. Before Phase 3, decide the session strategy (cookie sessions vs tokens)
since it drives CSRF and the web↔API origin setup.
