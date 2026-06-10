# ADR-002: Decommission Legacy v1 API Paths in Frontend

## Status
Accepted

## Date
2026-06-10

## Context
The frontend historically referenced a mix of legacy and v2 budget-service endpoints. Backend decommissioning of v1 routes requires the client to stop using non-v2 budget paths.

Requirements:

- Preserve app behavior while migrating endpoint paths
- Keep auth and agent integrations unchanged
- Add regression coverage for migrated request paths

## Decision
Adopt a strict frontend path policy for budget-service runtime calls:

- Budget-service endpoints must use `/api/v2/**`
- Non-budget exceptions remain unchanged:
  - `/auth/**` for login/auth endpoints
  - `/agent-api/**` for external agent chat integration

Applied changes:

1. Migrated `src/features/transactions/api/criticalitySummary.ts` from legacy `/api/transactions/account` to the v2 transactions base path.
2. Migrated `src/api/cache/cacheApiClient.ts` from `/api/cache` to `/api/v2/cache`.
3. Added regression tests for migrated paths:
   - `src/features/transactions/api/criticalitySummary.test.ts`
   - `src/api/cache/cache.test.ts`

## Alternatives Considered

### A) Leave existing mixed path usage
- Pros: no immediate changes
- Cons: runtime failures after v1 shutdown; inconsistent API contracts
- Rejected: incompatible with decommissioning goal

### B) Hardcode v2 paths ad hoc in each API function
- Pros: quick local edits
- Cons: path policy spread across files; higher maintenance risk
- Rejected: endpoint versioning should stay centralized in API client/base path layers

### C) Migrate all `/v1` strings including agent/chat paths
- Pros: aggressive consistency
- Cons: breaks third-party chat contract not governed by budget API lifecycle
- Rejected: out of scope and functionally incorrect for agent provider integration

## Consequences

- Frontend budget runtime traffic aligns with backend v2-only policy
- Migration risk reduced by targeted regression tests
- Auth and agent flows remain stable and intentionally separate
- Future API version changes are easier due to centralized base path abstractions

## Related Files

- `src/features/transactions/api/criticalitySummary.ts`
- `src/features/transactions/api/criticalitySummary.test.ts`
- `src/api/cache/cacheApiClient.ts`
- `src/api/cache/cache.test.ts`

