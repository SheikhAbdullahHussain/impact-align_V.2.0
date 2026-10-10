# ADR-001: Initial architecture

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

ImpactAlign SDG needs a maintainable, secure, internationally extensible platform built incrementally. The
original brief proposed Next.js + NestJS + PostgreSQL/Prisma (+ pgvector). The project owner then specified the
backend as **Node.js, Express.js and MongoDB**.

## Decision

- **Monorepo with npm workspaces** (`apps/*`, `packages/*`); no extra orchestrator yet.
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui-style components.
- **Backend:** Node.js 22, Express 5, TypeScript, REST + OpenAPI; **MongoDB via Mongoose**; Redis (ioredis).
- **Validation:** Zod everywhere; shared schemas in `packages/validation`, shared types in `packages/types`.
- **Packages compile to CommonJS + `.d.ts`** and are consumed from `dist/` so the Express API and Next apps
  share them without per-app transpilation.
- **Security by default:** nonce-based CSP, helmet, CORS allow-list, rate limiting, env validation that fails fast.
- **Testing:** Vitest (+ Supertest for the API, Testing Library for React).

## Deviations from the original brief

| Brief               | Chosen                                                            | Reason                                                                                                    |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| NestJS              | Express 5                                                         | Owner-specified backend                                                                                   |
| PostgreSQL + Prisma | MongoDB + Mongoose                                                | Owner-specified backend                                                                                   |
| pgvector            | **Undecided**                                                     | Needs an alternative for semantic search (e.g. Atlas Vector Search or a vector store) before the AI phase |
| shadcn/ui CLI       | Hand-written shadcn-style primitives (`components.json` included) | The CLI needs registry access; the pattern (Radix Slot + CVA + `cn`) is identical                         |
| Husky/lint-staged   | As specified                                                      | —                                                                                                         |

## Assumptions (documented per the "choose the safest option" rule)

1. **npm workspaces, not pnpm/Turborepo** — fewest moving parts; a build orchestrator can be added if build time grows.
2. **ESLint 9** — `eslint-plugin-jsx-a11y` does not yet allow ESLint 10 in its peer range, and accessibility linting is required.
3. **TypeScript 5.9** — chosen conservatively; newer major versions were not evaluated against the toolchain.
4. **Brand tokens** (ink navy, evidence teal, recognition gold) were carried over from the earlier prototype as _proposed_ values (`#0f2040`, Tailwind teal, `#c9a227`); replace with the official palette if it differs.
5. **System font stack** — avoids third-party font requests (privacy and CSP); revisit with self-hosted fonts.
6. **All web/admin pages render dynamically** because a per-request CSP nonce is required. Static caching can be reintroduced selectively (e.g. hash-based CSP for fully static pages).
7. **Public routes** use `/join-impactalign`; legal pages sit at the root (`/privacy`, …) as specified in Phase 1.
8. **Admin is a separate app/origin** and must not be exposed publicly until authentication exists.
9. **Legal pages are placeholders** with no legal claims; the LICENSE is a proprietary placeholder; the security contact is unset.
10. **In-memory rate limiting** is per instance; a Redis-backed store is required before scaling out.

## Consequences

- (+) Fewer frameworks to learn; flexible document model suits evolving SDG frameworks and evidence metadata.
- (−) No database-enforced relations or row-level security: referential integrity and tenant isolation must be enforced in code and tests.
- (−) Vector search strategy is an open decision.
- (−) Dynamic rendering of every page trades CDN cacheability for a strict CSP.

## Alternatives considered

- Keep NestJS + Prisma/PostgreSQL — rejected: contradicts the owner's stack choice.
- Turborepo/pnpm — deferred (see assumption 1).
- Static CSP with `unsafe-inline` — rejected: weakens XSS protection.
