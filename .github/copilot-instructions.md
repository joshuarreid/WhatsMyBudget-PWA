# GitHub Copilot Workspace Instructions

## Project Overview

This is **WhatsMyBudget PWA** — a React + TypeScript + Vite progressive web app for personal budget tracking.

---

## Backend API Reference

### Analytics API (v1 / legacy)

**Base path:** `/api/analytics`  
**Auth:** none (currently unprotected)

#### Conventions

- All responses are JSON.
- Optional request header: `X-Transaction-ID: <string>` (echoed in response).
- `LocalDate` format: `"2020-02-15"` (ISO-8601 date).
- `LocalDateTime` format: `"2026-05-24T18:42:55.569027"` (ISO-8601 timestamp).
- `400 Bad Request` returned for missing/invalid params.

#### Account Filter Semantics

- `account=joint` → joint transactions only.
- `account=<non-joint>` (e.g. `josh`) → that account's transactions **plus 50% of joint transaction amounts**.
- The 50% split applies to amounts; joint transactions still count toward grouped/count metrics.
- Multi-account breakdown endpoints: each non-joint row reflects direct totals + 50% joint contribution.

---

### Response Schemas

```ts
// AnalyticsPeriodsResponse
{ periods: string[], count: number }

// AnalyticsPeriodOverviewResponse
{ statementPeriod: string | null, paymentMethod: string | null, account: string | null, totalAmount: number, transactionCount: number }

// AnalyticsCategoryBreakdownResponse
{ category: string, totalAmount: number, transactionCount: number }

// AnalyticsCriticalityBreakdownResponse
{ criticality: string, totalAmount: number, transactionCount: number }

// AnalyticsAccountBreakdownResponse
{ account: string, totalAmount: number, transactionCount: number }

// AnalyticsPaymentMethodBreakdownResponse
{ paymentMethod: string, totalAmount: number, transactionCount: number }

// AnalyticsDailyTotalResponse
{ date: string, totalAmount: number, transactionCount: number }

// AnalyticsDuplicateResponse
{ rowHash: string, occurrences: number, totalAmount: number }

// BudgetTransaction (subset)
{
  id: number,
  name: string,
  amount: number,
  category: string,
  criticality: string,
  transactionDate: string,
  account: string,
  paymentMethod: string,
  statementPeriod: string,
  rowHash: string
}

// AnalyticsStatementPeriodSummaryResponse
{
  statementPeriod: string,
  periodStartDate: string | null,   // min transactionDate in period
  periodEndDate: string | null,     // max transactionDate in period
  totalAmount: number,
  transactionCount: number,
  essentialAmount: number,
  essentialCount: number,
  nonessentialAmount: number,
  nonessentialCount: number,
  categoryBreakdown: Record<string, { category: string, totalAmount: number, transactionCount: number }[]>,
  criticalityBreakdown: Record<string, { criticality: string, totalAmount: number, transactionCount: number }[]>,
  accountBreakdown: Record<string, { account: string, totalAmount: number, transactionCount: number }>,
  paymentMethodBreakdown: Record<string, { paymentMethod: string, totalAmount: number, transactionCount: number }[]>,
  outliers: Record<string, BudgetTransaction[]>,
  generatedAt: string
}
```

---

### Endpoints

#### Statement Periods

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/analytics/periods` | `AnalyticsPeriodsResponse` |

#### Period Analytics (`/api/analytics/periods/{period}/...`)

`period` path param must be non-blank (e.g. `FEBRUARY2020`).

| Method | Path | Optional Query Params | Response |
|--------|------|-----------------------|----------|
| GET | `/api/analytics/periods/{period}/overview` | `paymentMethod`, `account` | `AnalyticsPeriodOverviewResponse` |
| GET | `/api/analytics/periods/{period}/categories` | `paymentMethod`, `account` | `AnalyticsCategoryBreakdownResponse[]` |
| GET | `/api/analytics/periods/{period}/categories/distinct` | — | `string[]` (sorted asc) |
| GET | `/api/analytics/periods/{period}/categories/top` | `limit` (int, default 10, max 100), `paymentMethod`, `account` | `AnalyticsCategoryBreakdownResponse[]` |
| GET | `/api/analytics/periods/{period}/accounts` | `paymentMethod` | `AnalyticsAccountBreakdownResponse[]` |
| GET | `/api/analytics/periods/{period}/payment-methods` | `account` | `AnalyticsPaymentMethodBreakdownResponse[]` |
| GET | `/api/analytics/periods/{period}/criticality` | `paymentMethod`, `account` | `AnalyticsCriticalityBreakdownResponse[]` |
| GET | `/api/analytics/periods/{period}/daily` | `paymentMethod`, `account` | `AnalyticsDailyTotalResponse[]` |
| GET | `/api/analytics/periods/{period}/duplicates` | — | `AnalyticsDuplicateResponse[]` |
| GET | `/api/analytics/periods/{period}/uncategorized` | — | `BudgetTransaction[]` |
| GET | `/api/analytics/periods/{period}/outliers` | `limit` (int, default 20, max 200) | `BudgetTransaction[]` |

#### Global Distinct Categories

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/analytics/categories/distinct` | `string[]` (sorted asc) |

#### Range Analytics (`/api/analytics/range/...`)

`startDate` and `endDate` are required ISO-8601 dates (`YYYY-MM-DD`). Ranges are inclusive.

| Method | Path | Optional Query Params | Response |
|--------|------|-----------------------|----------|
| GET | `/api/analytics/range/overview` | `paymentMethod`, `account` | `AnalyticsPeriodOverviewResponse` (`statementPeriod` will be `null`) |
| GET | `/api/analytics/range/categories` | `paymentMethod`, `account` | `AnalyticsCategoryBreakdownResponse[]` |
| GET | `/api/analytics/range/categories/top` | `limit` (int, default 10, max 100), `paymentMethod`, `account` | `AnalyticsCategoryBreakdownResponse[]` |
| GET | `/api/analytics/range/accounts` | `paymentMethod` | `AnalyticsAccountBreakdownResponse[]` |
| GET | `/api/analytics/range/payment-methods` | `account` | `AnalyticsPaymentMethodBreakdownResponse[]` |
| GET | `/api/analytics/range/criticality` | `paymentMethod`, `account` | `AnalyticsCriticalityBreakdownResponse[]` |
| GET | `/api/analytics/range/daily` | `paymentMethod`, `account` | `AnalyticsDailyTotalResponse[]` |
| GET | `/api/analytics/range/duplicates` | — | `AnalyticsDuplicateResponse[]` |
| GET | `/api/analytics/range/uncategorized` | — | `BudgetTransaction[]` |
| GET | `/api/analytics/range/outliers` | `limit` (int, default 20, max 200) | `BudgetTransaction[]` |

#### Statement Period Summaries

Closed periods are persisted to DB (`statement_period_summaries`); open periods are computed live.

| Method | Path | Query Params | Response |
|--------|------|--------------|----------|
| GET | `/api/analytics/summaries/{period}` | — | `AnalyticsStatementPeriodSummaryResponse` |
| GET | `/api/analytics/summaries` | `startPeriod` (required), `endPeriod` (required) | `AnalyticsStatementPeriodSummaryResponse[]` (sorted by calendar order) |

Notes:
- `periodStartDate` / `periodEndDate` are derived from the **min/max `transactionDate`** of transactions in the period.
- Breakdown maps are keyed by `BudgetTransaction.account`.
- `outliers[account]` is sorted by `amount` desc, then `transactionDate` desc.

---

## Frontend Conventions

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite
- **Data fetching:** TanStack Query (React Query)
- **API clients** live in `src/api/` and `src/features/*/api/`
- **Feature-based folder structure:** `src/features/<feature>/` with `api/`, `components/`, `hooks/` subdirectories
- **Routing:** `src/pages/router.tsx`
- **Auth:** JWT-based; token stored via `src/features/auth/api/tokenStorage.ts`; protected routes via `RequireAuth` component
- **Global state:** Zustand stores in `src/store/`
- **Statement period context:** `src/context/StatementPeriodContext.tsx`
- **Profile context:** `src/context/ProfileContext.tsx`

When adding a new analytics feature, follow this pattern:
1. Define types in `src/features/<feature>/api/<feature>.types.ts`
2. Add API client methods in `src/features/<feature>/api/<feature>ApiClient.ts`
3. Define query keys in `src/features/<feature>/api/<feature>QueryKeys.ts`
4. Write React Query hooks in `src/features/<feature>/hooks/`
5. Build components in `src/features/<feature>/components/`
6. Export from `src/features/<feature>/index.ts`

