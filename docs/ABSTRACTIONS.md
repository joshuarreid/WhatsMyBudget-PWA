# Abstractions

## Purpose

This document captures the major abstractions used in the frontend and their ownership boundaries.

## 1) Transport Abstraction: `ApiClient`

File: `src/api/ApiClient.ts`

Responsibilities:

- Central Axios configuration
- Inject Bearer token when available
- Inject `X-Transaction-ID` when missing
- Handle global `401` by triggering session logout

Why it exists:

- Keeps auth/header logic out of feature code
- Enforces consistent request behavior across features

## 2) Feature API Client Abstraction

Files:

- `src/features/transactions/api/transactionsApiClient.ts`
- `src/features/projectedTransactions/api/projectedTransactionsApiClient.ts`
- `src/features/statements/api/statementsApiClient.ts`
- `src/api/cache/cacheApiClient.ts`

Responsibilities:

- Define feature base paths
- Reuse the shared transport layer

Why it exists:

- Avoids hardcoded endpoint fragments spread across hooks/components
- Keeps endpoint versioning changes localized

## 3) API Function Abstraction

Examples:

- `src/features/transactions/api/transactions.ts`
- `src/features/projectedTransactions/api/projectedTransactions.ts`
- `src/features/statements/api/statements.ts`
- `src/api/cache/cache.ts`

Responsibilities:

- Build query params
- Call API clients
- Normalize server response shape differences when necessary

Why it exists:

- Hooks/components consume stable, typed function contracts
- Backend response drift can be handled in one place

## 4) Query Hook Abstraction (TanStack Query)

Examples:

- `src/features/transactions/hooks/useTransactions.ts`
- `src/features/statements/hooks/useCurrentStatementPeriod.ts`

Responsibilities:

- Caching, loading/error state, retries, stale-time policies
- Expose UI-ready state and data

Why it exists:

- Separates server-state concerns from rendering logic

## 5) Context + Store Abstraction

Files:

- `src/context/StatementPeriodContext.tsx`
- `src/context/ProfileContext.tsx`
- `src/store/*.ts`

Responsibilities:

- Cross-cutting UI state
- Selection and initialization flow for statement periods/profiles

Why it exists:

- Prevents prop drilling and duplicate local state logic

## 6) Routing + Guard Abstraction

Files:

- `src/pages/router.tsx`
- `src/features/auth/components/RequireAuth.tsx`

Responsibilities:

- Route composition
- Protected-route enforcement

Why it exists:

- Keeps auth gating consistent and centralized

## Versioning Rule

Budget-service runtime endpoints are v2-only:

- Allowed: `/api/v2/**`
- Exceptions by design: `/auth/**`, `/agent-api/**`

When adding new budget APIs, always place path constants in feature API client files and never hardcode ad hoc route strings in hooks/components.

