import { useMemo } from 'react'
import type { BudgetTransaction } from '../api/transactions/transactions.types'

export type Week = {
  weekStart: Date
  weekEnd: Date // exclusive
  transactions: BudgetTransaction[]
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1) - day // 0 (Sun) -> -6, 1 (Mon) -> 0, ...
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function parseISODateOnly(dateStr: string): Date | null {
  const d = new Date(dateStr)
  if (!Number.isFinite(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

export function useCalculateWeeks(transactions: BudgetTransaction[]): Week[] {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) return []
    // Sort transactions by date ascending
    const sorted = [...transactions].sort((a, b) => {
      const da = parseISODateOnly(a.transactionDate)
      const db = parseISODateOnly(b.transactionDate)
      if (!da || !db) return 0
      return da.getTime() - db.getTime()
    })
    // Find the first Monday on or before the earliest transaction
    const firstTxDate = parseISODateOnly(sorted[0].transactionDate)
    if (!firstTxDate) return []
    const firstMonday = getMonday(firstTxDate)
    // Find the last transaction date
    const lastTxDate = parseISODateOnly(sorted[sorted.length - 1].transactionDate)
    if (!lastTxDate) return []
    // Build weeks from firstMonday up to (and including) the week containing lastTxDate
    const weeks: Week[] = []
    let weekStart = new Date(firstMonday)
    while (weekStart <= lastTxDate) {
      const weekEnd = addDays(weekStart, 7)
      // Collect transactions in this week
      const weekTxs = sorted.filter((t) => {
        const dt = parseISODateOnly(t.transactionDate)
        return dt && dt >= weekStart && dt < weekEnd
      })
      weeks.push({ weekStart: new Date(weekStart), weekEnd, transactions: weekTxs })
      weekStart = weekEnd
    }
    return weeks
  }, [transactions])
}

