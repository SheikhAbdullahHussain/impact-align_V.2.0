# Database architecture: SDG catalogue and frameworks (Phase 4a)

MongoDB via Mongoose (`packages/database`). The API reads data only through repository
interfaces (`apps/api/src/data/repositories.ts`), implemented for Mongo and in memory.

## Collections
| Model | Purpose | Key indexes |
|---|---|---|
| SDG | The 17 goals | unique `number`, unique `code` |
| SDGTarget | Targets of an SDG | `sdgId`, unique `(sdgId, code)` |
| SDGIndicator | Indicators of an SDG, optionally of a target | `sdgId`, `targetId`, unique `(sdgId, code)` |
| Framework | Assessment framework | unique `slug` |
| FrameworkVersion | One published version of a framework | `frameworkId`, unique `(frameworkId, version)` |
| Criterion | Criterion in one framework version; optional links to SDG, target, indicator | `frameworkVersionId`, unique `(frameworkVersionId, code)`, `sdgId`, `targetId`, `indicatorId` |
| EvidenceRequirement | Evidence needed for a criterion | `criterionId`, unique `(criterionId, code)` |

## Versioning
Criteria and evidence requirements belong to a `FrameworkVersion`, never directly to a
`Framework`. A new version is a new document, so submissions keep pointing at the version
they were assessed against.

## Soft delete
Every model has `deletedAt` (null = active). There is no automatic query filter: repository
implementations must include `deletedAt: null` in every read and set `deletedAt` instead of
deleting.

## SDG data policy
Official SDG data is never invented. `seedSDGs()` inserts only `number` and `code` for goals
1-17; `title`, `description`, `officialUrl` and `metadata` stay `null`. It uses `$setOnInsert`,
so re-running never overwrites curated data. Official titles, targets and indicators must be
imported from a verified official source.

## API (read-only, `/api/v1/sdgs`)
- `GET /` list of SDGs
- `GET /:id` one SDG (`:id` = number 1-17)
- `GET /:id/targets`
- `GET /:id/indicators`

Responses are `{ data }`. `:id` is validated with Zod (`sdgNumberParamSchema`): 400 for
invalid ids, 404 for unknown SDGs. Internal fields (`metadata`, timestamps) are not exposed.