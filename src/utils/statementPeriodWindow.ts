const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
] as const

type MonthName = (typeof MONTHS)[number]
export type ParsedStatementPeriod = { monthIndex: number; year: number }

export function parseStatementPeriod(period: string): ParsedStatementPeriod | null {
  const match = /^([A-Z]+)(\d{4})$/.exec(String(period ?? '').trim().toUpperCase())
  if (!match) return null
  const monthName = match[1] as MonthName
  const monthIndex = MONTHS.indexOf(monthName)
  if (monthIndex === -1) return null
  const year = Number(match[2])
  if (!Number.isFinite(year)) return null
  return { monthIndex, year }
}

export function formatStatementPeriod(monthIndex: number, year: number): string {
  return `${MONTHS[monthIndex]}${year}`
}

export function addMonthsToStatementPeriod(period: string, deltaMonths: number): string {
  const parsed = parseStatementPeriod(period)
  if (!parsed) return ''
  const total = parsed.year * 12 + parsed.monthIndex + deltaMonths
  const year = Math.floor(total / 12)
  const monthIndex = ((total % 12) + 12) % 12
  return formatStatementPeriod(monthIndex, year)
}

export function buildStatementPeriodWindow(
  current: string | null | undefined,
  opts: { monthsBack?: number; monthsForward?: number } = {}
): string[] {
  if (!current) return []
  const parsed = parseStatementPeriod(current)
  if (!parsed) return []

  const monthsBack = opts.monthsBack ?? 4
  const monthsForward = opts.monthsForward ?? 0

  const periods: string[] = []
  for (let offset = -monthsBack; offset <= monthsForward; offset++) {
    periods.push(addMonthsToStatementPeriod(current, offset))
  }
  return periods.filter(Boolean)
}

