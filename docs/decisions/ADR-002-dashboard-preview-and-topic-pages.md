# ADR-002: Dashboard UI preview gate and topic sub-pages

- **Status:** Accepted
- **Date:** 2026-10-11

## Context

The dashboard interface and the public section sub-pages were requested before authentication (Phase 3) and the
database (Phase 4) exist. A dashboard without authentication must never look functional or expose data.

## Decision

1. **Dashboard is a UI preview only.** `/dashboard/*` has its own layout (separate from the marketing shell), 15
   routes from the product spec, empty states, a visible "Preview · not signed in" badge and a note that nothing
   is saved. It contains no data, forms or fake numbers.
2. **Production gate.** `isDashboardPreviewEnabled()` makes the dashboard visible outside production and returns
   404 in production unless `DASHBOARD_PREVIEW_ENABLED=true`. The gate is server-side. It is a stop-gap, **not**
   access control; real server-side, role- and organization-aware authorization replaces it in Phase 3.
3. **Dashboard is never indexed:** `noindex` metadata, `Disallow: /dashboard` in robots, absent from the sitemap.
4. **Topic sub-pages** (`/<section>/<topic>`) are generated from `lib/section-content.ts`. Each is a labelled
   placeholder with breadcrumbs and links to sibling topics; unknown combinations return 404.

## Consequences

- (+) Navigation and information architecture can be reviewed now without implying finished features.
- (+) Safe default in production.
- (−) Routes and nav labels will need to follow the real feature set when Phase 7 is built.
- (−) Section content is code-resident placeholder copy until a content source exists.
