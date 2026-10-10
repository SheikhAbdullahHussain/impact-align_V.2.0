# Deployment

Phase 1 ships **templates only** — no environment is provisioned and no secrets live in this repo.

## Production checklist (to complete in a later phase)

- Provide real secrets through the platform's secret manager, never through files in git.
- Use dedicated, least-privilege MongoDB users (not the dev root user) and enable TLS to MongoDB/Redis.
- Set `NODE_ENV=production`; the API refuses placeholder credentials, non-HTTPS CORS origins and
  Swagger UI in production.
- Set `API_TRUST_PROXY` to the number of proxies in front of the API.
- Terminate TLS at the reverse proxy (`../nginx/nginx.conf` is a starting template) and restrict the
  admin host by network until authentication exists.
- Back the API rate limiter with Redis before running more than one API instance (the in-memory
  store is per-process).
- Configure MongoDB backups and a retention policy (see `docs/privacy`).
