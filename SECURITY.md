# Security Policy

> Phase 1 covers the project foundation only. Authentication, authorization and data-protection
> controls arrive in later phases; this file will be extended then (Phase 3).

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately to: **[SECURITY CONTACT — to be set by the project owner before launch]**

Include a description, reproduction steps and affected components. Do not include real personal data.

## Ground rules for contributors

- Never commit secrets, API keys, tokens or real `.env` files. Use environment variables;
  `.env.example` contains placeholders only.
- All external input is validated (Zod) at the boundary; authorization is enforced on the server,
  never trusted from the client.
- Organization data is isolated: no query may return another organization's private data.
- AI output is always labelled AI-generated and never makes a final validation or accreditation decision.

See [`docs/security/security-architecture.md`](docs/security/security-architecture.md) for the security
architecture and its current implementation status.

## Supported versions

Pre-release: only the `main` branch is supported.
