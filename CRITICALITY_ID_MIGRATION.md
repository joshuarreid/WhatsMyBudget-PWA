# Front-end Criticality Migration (criticality_id) - FINAL

This document summarizes the front-end migration to fully use `criticality_id` (numeric) instead of `criticality` (string).

## Overview
The migration has been completed to fully transition from using `criticality` (string) to `criticality_id` (number). This is the final leg of the migration where backwards compatibility has been removed.

## Criticality Mapping
The frontend now uses the following mapping between IDs and display names:
```
1 = "Essential"
2 = "Nonessential"
3 = "Planned"
```

## Key Changes

### Type Definitions
**Updated Interfaces:**
- `BudgetTransaction`: Changed `criticality: string` to `criticality_id: number` (required)
- `ProjectedTransaction`: Changed `criticality: string` to `criticality_id: number` (required)
- `TransactionFilters`: Changed filter from `criticality?: string` to `criticality_id?: number`
- `ProjectedTransactionFilters`: Changed filter from `criticality?: string` to `criticality_id?: number`

### Component Updates

All components that handle transaction creation/editing now use `criticality_id`:

1. **ProjectedTransactionList.tsx**
   - FormState stores `criticality_id?: number`
   - Criticality dropdown uses numeric IDs
   - API payloads only send `criticality_id`

2. **CriticalityBreakdownTreeWidget.tsx**
   - FormState stores `criticality_id: number`
   - Default form initializes with `criticality_id: 2` (Nonessential)
   - Category change mapping converts strings to IDs

3. **CriticalitySummarySectionedWidget.tsx**
   - Same updates as CriticalityBreakdownTreeWidget

4. **NestedCategoryTable.tsx**
   - FormState stores `criticality_id: number`
   - Criticality dropdown renders options dynamically from `CRITICALITY_NAMES` map
   - All form handling updated to use numeric IDs

5. **useCriticalitySummaries.ts**
   - Filtering now uses `criticality_id === 1` for Essential
   - Filtering now uses `criticality_id === 2` for Nonessential
   - Removed string-based filtering logic

## API Contract

All transactions now send `criticality_id` as a required numeric field:
```json
{
  "name": "Coffee",
  "amount": 3.50,
  "category": "dining",
  "criticality_id": 3,
  "transactionDate": "2026-06-01",
  "account": "josh",
  "paymentMethod": "visa",
  "statementPeriod": "JUNE2026"
}
```

## Backwards Compatibility
**Removed**: The `criticality` field is no longer sent in API payloads. This is now a breaking change - the backend must return responses that include `criticality_id` for the frontend to function properly.

## Changes Summary
- ✅ All type definitions updated to use `criticality_id: number`
- ✅ All components updated to use numeric IDs
- ✅ All filtering logic updated to use numeric IDs
- ✅ All form state management updated to use numeric IDs
- ✅ Backwards compatibility fully removed
- ✅ TypeScript validation passes
- ✅ ESLint validation passes

## Validation Results
- ✅ TypeScript type checking: PASS
- ✅ ESLint linting: PASS
- ✅ No compilation errors
- ✅ All type definitions are consistent

## Migration Status: COMPLETE

The front-end has been fully migrated to use `criticality_id` as the primary identifier for transaction criticality. The migration removes all backwards compatibility and is ready for deployment once the backend supports the new required format.


