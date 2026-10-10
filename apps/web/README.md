# @impactalign/web

Public website (Next.js App Router). Marketing routes live in `app/(marketing)`; the authenticated dashboard
will be a separate route group with its own layout. Per-request nonce CSP is set in `proxy.ts`, which is why
pages render dynamically. All pages besides the home page are labelled placeholders.
