# API documentation

- OpenAPI 3.1 source: `apps/api/src/openapi/openapi.ts` (hand-maintained; extend as endpoints are added).
- Generated copy: [`openapi.json`](./openapi.json) — regenerate with `npm run openapi:export -w @impactalign/api`.
- Interactive docs: set `API_SWAGGER_ENABLED=true` (development only) and open `http://localhost:4000/docs`.

## Conventions

- All errors: `{ "error": { "code": string, "message": string, "requestId": string } }`.
- Every response carries `X-Request-Id`; quote it when reporting problems.
- Feature routes will live under `/api/v1/*`; health endpoints are unversioned and unauthenticated.
- Rate limiting returns `429` with code `RATE_LIMITED` (health endpoints are exempt).
