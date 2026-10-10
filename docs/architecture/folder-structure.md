# Folder Structure and Architectural Rules

```
impactalign/
├── apps/
│   ├── web/        Next.js public site (App Router; marketing routes in the (marketing) group)
│   ├── api/        Express REST API (src/: app.ts, main.ts, common/, config/, health/, infrastructure/, openapi/)
│   └── admin/      Next.js admin console (separate app, separate origin)
├── packages/
│   ├── config/     Env schemas, site/brand config, CSP + security headers
│   ├── types/      Shared TypeScript contracts
│   ├── validation/ Shared Zod schemas
│   ├── database/   Mongoose connection + models
│   ├── auth/       (placeholder) authentication & authorization
│   ├── ai/         (interfaces) AI provider abstraction
│   └── ui/         Shared accessible React primitives
├── docs/           architecture · api · security · privacy · product · decisions
├── infrastructure/ docker (dev stores + Dockerfiles) · nginx (template) · deployment (notes)
├── scripts/        run-workspaces.mjs · check-env.mjs · clean.mjs
└── .github/        CI workflow, Dependabot
```

## Dependency direction

```
types ← validation ← (api, web, admin)
config ← (api, web, admin)
database ← api only
ui ← web, admin
```

Rules:

1. **Apps never import from other apps.** Shared code goes in a package.
2. **`database` is imported by `api` only.** Web and admin reach data exclusively through the API.
3. **Business logic lives in the API** (and shared pure logic in packages). Web/admin render and call the
   API; they never re-implement authorization or validation rules — they may reuse the same Zod schema
   from `packages/validation` for form UX, but the server always re-validates.
4. **Shared contracts live in `packages/types`;** schemas that must match them use
   `satisfies z.ZodType<...>` so the two cannot drift.
5. **Public marketing and authenticated areas are separate route groups/layouts;** admin is a separate app.
6. **Packages build to `dist/` (CommonJS + `.d.ts`)** and are consumed through their `main`/`types`. Build
   order is enforced by `scripts/run-workspaces.mjs` (config → types → validation → database → auth → ai → ui).
7. **No secrets in code.** Configuration enters through environment variables validated by `packages/config`.
8. **Components stay small and reusable;** no monolithic page components.

## Where things go (Phase 2 will add the empty feature folders)

| Concern                 | Location                                             |
| ----------------------- | ---------------------------------------------------- |
| New REST feature        | `apps/api/src/<feature>/` (router, service, schemas) |
| Mongoose model          | `packages/database/src/models/`                      |
| Request/response type   | `packages/types/src/`                                |
| Input validation schema | `packages/validation/src/`                           |
| Reusable UI primitive   | `packages/ui/src/components/`                        |
| Page-specific component | `apps/<app>/components/<area>/`                      |
