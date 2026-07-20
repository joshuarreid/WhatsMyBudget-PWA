export type MonthlySpendingTrendRange = {
  statementPeriod: string
  label: string
  startDate: string
  endDate: string
}

export type MonthlySpendingTrendPoint = MonthlySpendingTrendRange & {
  totalAmount: number
  essentialAmount: number
  nonessentialAmount: number
  transactionCount: number
}

export type MonthlySpendingTrendStats = {
  totalAmount: number
  monthlyAverage: number
  essentialAverage: number
  nonessentialAverage: number
  trendAmount: number
  trendPercent: number | null
  trend: 'growing' | 'decreasing' | 'flat'
}

const formatDateOnly = (date: Date): string => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getMonthEnd = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0)

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)

export const buildLastSixMonthRanges = (referenceDate = new Date(), monthCount = 6): MonthlySpendingTrendRange[] => {
  const baseYear = referenceDate.getFullYear()
  const baseMonth = referenceDate.getMonth()

  return Array.from({ length: monthCount }, (_, index) => {
    const monthOffset = index - monthCount
    const monthStart = new Date(baseYear, baseMonth + monthOffset, 1)
    const monthEnd = getMonthEnd(monthStart.getFullYear(), monthStart.getMonth())

    return {
      statementPeriod: `${monthStart.toLocaleString('en-US', { month: 'long' }).toUpperCase()}${monthStart.getFullYear()}`,
      label: formatMonthLabel(monthStart),
      startDate: formatDateOnly(monthStart),
      endDate: formatDateOnly(monthEnd),
    }
  })
}

export const buildMonthlySpendingTrendStats = (
  points: MonthlySpendingTrendPoint[]
): MonthlySpendingTrendStats => {
  if (points.length === 0) {
    return {
      totalAmount: 0,
      monthlyAverage: 0,
      essentialAverage: 0,
      nonessentialAverage: 0,
      trendAmount: 0,
      trendPercent: null,
      trend: 'flat',
    }
  }

  const totalAmount = points.reduce((sum, point) => sum + point.totalAmount, 0)
  const essentialTotal = points.reduce((sum, point) => sum + point.essentialAmount, 0)
  const nonessentialTotal = points.reduce((sum, point) => sum + point.nonessentialAmount, 0)
  const monthlyAverage = totalAmount / points.length
  const essentialAverage = essentialTotal / points.length
  const nonessentialAverage = nonessentialTotal / points.length
  const first = points[0]
  const latest = points.at(-1) ?? first
  const trendAmount = latest.totalAmount - first.totalAmount

  let trendPercent: number | null = null
  if (first.totalAmount !== 0) {
    trendPercent = (trendAmount / first.totalAmount) * 100
  } else if (latest.totalAmount !== 0 && first.totalAmount === 0) {
    trendPercent = 100
  }

  const trend = trendAmount > 0 ? 'growing' : trendAmount < 0 ? 'decreasing' : 'flat'

  return {
    totalAmount,
    monthlyAverage,
    essentialAverage,
    nonessentialAverage,
    trendAmount,
    trendPercent,
    trend,
  }
}
