import { parseStatementPeriod } from './statementPeriodWindow'

/**
 * Converts a statement period into an <input type="date"> value that is the
 * last day of the statement month.
 *
 * Example: APRIL2026 -> 2026-04-30
 */
export function statementPeriodToLastDayInputDate(period: string): string {
  const parsed = parseStatementPeriod(period)
  if (!parsed) return ''

  // JS Date months are 0-based; day 0 gives last day of previous month.
  const dt = new Date(parsed.year, parsed.monthIndex + 1, 0)

  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Normalizes an arbitrary date string into yyyy-mm-dd for <input type="date">.
 */
export function toInputDate(dateStr?: string): string {
  if (!dateStr) return ''
  const dt = new Date(dateStr)
  if (!Number.isFinite(dt.getTime())) return ''

  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
