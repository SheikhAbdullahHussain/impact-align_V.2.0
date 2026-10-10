# Security Architecture

This document separates what **exists in Phase 1** from what is **planned**. Nothing planned should be
described to users as a security guarantee until it is implemented and tested.

## Implemented in Phase 1

| Control                            | Where                                               | Notes                                                                                                                                               |
| ---------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secrets out of source              | `.env.example` placeholders, `.gitignore`           | Real `.env*` files are git-ignored                                                                                                                  |
| Fail-fast env validation           | `packages/config/src/env.ts`                        | Errors list variable names, never values. In production it rejects placeholder credentials, non-HTTPS CORS origins and Swagger UI                   |
| Security headers (API)             | `helmet` in `apps/api/src/app.ts`                   | `default-src 'none'`, `frame-ancestors 'none'`, HSTS, nosniff, no-referrer; `X-Powered-By` removed                                                  |
| Security headers + CSP (web/admin) | `next.config.ts`, `proxy.ts`                        | Per-request **nonce-based CSP** (no `unsafe-inline`/`unsafe-eval` in production), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP  |
| CORS allow-list                    | API                                                 | Only configured origins receive CORS headers                                                                                                        |
| Rate limiting                      | `express-rate-limit`                                | Per-IP; health probes exempt. In-memory store (per instance)                                                                                        |
| Body limits + safe parsing         | API                                                 | 100 kB JSON cap; malformed JSON → 400, oversized → 413                                                                                              |
| Secure error handling              | `common/error-handler.ts`                           | Uniform envelope with request ID; 500s hide internals; probe failures never expose hosts                                                            |
| Structured logging                 | `pino` / `pino-http`                                | Authorization, cookies and `*.password/token/secret` redacted                                                                                       |
| NoSQL-injection hardening          | `connectMongo` (`sanitizeFilter`), `objectIdSchema` | Operator objects in untrusted filters are neutralised; ids validated as 24-hex                                                                      |
| Audit-log foundation               | `packages/database` `AuditLog`                      | Append-only at the Mongoose layer (update/delete hooks throw)                                                                                       |
| Dashboard preview gate             | `apps/web/lib/dashboard-gate.ts`                    | `/dashboard` returns 404 in production unless `DASHBOARD_PREVIEW_ENABLED=true`. UI-only stop-gap — **not** access control (see ADR-002)             |
| Crawler controls                   | `robots.ts`, `noindex` on admin/login               | Admin is never indexable                                                                                                                            |
| Container hardening                | `infrastructure/docker`                             | Non-root runtime user, prod-only dependencies, dev ports bound to 127.0.0.1 (**Dockerfiles not built in this environment — see Known limitations**) |
| Supply chain                       | CI audit job, Dependabot                            | `npm audit --omit=dev --audit-level=high`                                                                                                           |

## Planned (not implemented)

- **Authentication & sessions (Phase 3):** strong password hashing, secure cookie sessions, MFA-ready
  design, email verification, one-time reset tokens, login throttling/lockout, CSRF protection for
  cookie-authenticated routes.
- **Authorization (Phase 3):** permissions separate from roles; **server-side** checks on every protected
  endpoint; organization-level access control.
- **Organization isolation (Phase 3–4):** repository layer requiring an org scope + cross-org tests.
- **Evidence uploads (Phase 7):** MIME/extension/size validation, filename sanitisation, private object
  storage, access-controlled downloads, malware-scan integration point, audit events.
- **AI governance (AI phase):** AI output labelled and logged; final validation and accreditation decisions
  are made by humans only (`packages/ai` encodes the label constant and the rule).
- **Distributed rate limiting** (Redis-backed) before multi-instance deployment.

## MongoDB-specific notes

- **Operator injection:** validate every request body/query with Zod before it reaches a query; never
  spread request objects into filters. `sanitizeFilter` is a second line of defence, not the first.
- **Tenant isolation is application-enforced** (no row-level security). Treat any query without an
  organization scope on tenant data as a bug.
- **Audit immutability:** the model hooks only stop accidental use of the Mongoose API. For real
  tamper-resistance, give the application's database user insert-only rights on the audit collection and
  keep admin credentials out of the app.
- **Production database:** dedicated least-privilege users, TLS in transit, encryption at rest, backups
  with tested restores. The Docker dev root user is for local use only.

## Trust boundaries

Browser → (web/admin | API) is untrusted. The API validates all input and is the only component that
talks to MongoDB, Redis, object storage and AI providers. Web and admin hold no secrets.

## Reporting

See [`SECURITY.md`](../../SECURITY.md). The security contact is a placeholder until the owner sets one.
