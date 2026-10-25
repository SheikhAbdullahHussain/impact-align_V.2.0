# Contributing

## Setup

```bash
nvm use                 # Node 22
cp .env.example .env    # placeholders only — never commit .env
npm ci
npm run dev:infra       # MongoDB + Redis via Docker
npm run dev:api         # http://localhost:4000/health
npm run dev:web         # http://localhost:3000
npm run dev:admin       # http://localhost:3001
```

## Before opening a pull request

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Husky runs `lint-staged` (ESLint + Prettier) on every commit.

## Rules

1. TypeScript strict; no `any` unless unavoidable and justified in a comment.
2. Shared contracts live in `packages/types`, shared validation in `packages/validation`. Never
   duplicate business logic between `web`, `admin` and `api` (see `docs/architecture/folder-structure.md`).
3. Validate all external input; enforce authorization on the server.
4. Keep components small and reusable; use semantic HTML; keep UI accessible and responsive.
5. Add tests for critical behaviour. Security-relevant changes need a test for the failure case.
6. Record significant architecture choices as an ADR in `docs/decisions/`.
7. Never commit secrets. If you do, rotate them immediately and tell the maintainers.
