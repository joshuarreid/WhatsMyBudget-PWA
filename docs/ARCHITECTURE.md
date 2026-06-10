# Architecture

## Overview

WhatsMyBudget PWA is a React 19 + TypeScript + Vite application with feature-oriented modules and a shared HTTP client.

The app now treats `/api/v2/**` as the canonical budget-service API surface.

## High-Level Structure

- `src/pages/` - route-level screens
- `src/layouts/` - page layout shells
- `src/features/` - feature modules (api, hooks, components)
- `src/api/` - cross-feature HTTP clients and shared API helpers
- `src/context/` - cross-cutting app context providers
- `src/store/` - Zustand stores for global UI/app state
- `src/config/` - environment/config bootstrap

## Runtime Boundaries

### Budget Service (JWT protected)

- Budget runtime calls use `/api/v2/**`
- Implemented via `ApiClient` in `src/api/ApiClient.ts`
- Token management lives in `src/features/auth/api/tokenStorage.ts`

### Auth

- Login endpoint remains `/auth/login`
- This is intentionally outside `/api/v2/**`

### Agent Chat Integration

- Agent traffic uses `/agent-api/**`
- Default upstream path is `/v1/chat/completions` (agent provider contract)
- This path is separate from budget-service API versioning

## Request Flow

1. UI calls feature hooks (`src/features/*/hooks/*`)
2. Hooks call feature API functions (`src/features/*/api/*.ts`)
3. API functions use feature API clients (`*ApiClient.ts`) built on shared `ApiClient`
4. `ApiClient` injects auth + `X-Transaction-ID`, handles `401` logout behavior

## API Path Policy

- Budget-service endpoints: `/api/v2/**`
- Non-budget exceptions:
  - `/auth/**` for authentication
  - `/agent-api/**` for external agent/chat traffic

## Recent Change (2026-06-10)

Completed migration of remaining non-v2 budget runtime paths:

- `src/features/transactions/api/criticalitySummary.ts` now uses v2 transactions path
- `src/api/cache/cacheApiClient.ts` now uses `/api/v2/cache`

Regression tests added:

- `src/features/transactions/api/criticalitySummary.test.ts`
- `src/api/cache/cache.test.ts`

