import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/Modal'
import { useStatements } from '@/features/statements'
import { parseStatementPeriod } from '@/utils/statementPeriodWindow'
import { fetchAccountTransactions } from '../api/transactions'
import type { BudgetTransaction } from '../api/transactions.types'
import { useCalculateWeeks } from '../hooks/useCalculateWeeks'
import { TransactionList } from './TransactionList'

type MetricKey = 'food' | 'gas' | 'social' | 'diningOut' | 'groceries'

type SpendingAveragesStatCardsProps = {
  account: string
  selectedPeriod: string
  transactions: BudgetTransaction[]
  isPending: boolean
  isError: boolean
}

function formatMoney(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function classifyMetric(category: string): MetricKey | null {
  if (category.trim().toLowerCase() === 'dining out') return 'diningOut'
  if (category.trim().toLowerCase() === 'groceries') return 'groceries'
  const cat = category.toLowerCase()
  if (cat.includes('gas')) return 'gas'
  if (cat.includes('food')) return 'food'
  if (cat.includes('social')) return 'social'
  return null
}

const comparePeriods = (a: string, b: string) => {
  const parsedA = parseStatementPeriod(a)
  const parsedB = parseStatementPeriod(b)
  if (!parsedA || !parsedB) return a.localeCompare(b)
  return parsedA.year * 12 + parsedA.monthIndex - (parsedB.year * 12 + parsedB.monthIndex)
}

const buildTrend = (current: number, baseline: number) => {
  const delta = current - baseline
  const percent = baseline !== 0 ? (delta / baseline) * 100 : current !== 0 ? 100 : null
  return {
    direction: delta > 0 ? ('growing' as const) : delta < 0 ? ('decreasing' as const) : ('flat' as const),
    percent,
  }
}

const trendTone = (direction: 'growing' | 'decreasing' | 'flat') =>
  direction === 'decreasing' ? '#1fbf75' : direction === 'growing' ? '#f87171' : 'rgba(230,238,248,0.65)'

const sumAmounts = (items: BudgetTransaction[]) =>
  items.reduce((sum, item) => sum + (typeof item.amount === 'number' ? item.amount : 0), 0)

export const SpendingAveragesStatCards = ({
  account,
  selectedPeriod,
  transactions,
  isPending,
  isError,
}: SpendingAveragesStatCardsProps) => {
  const [monthCount, setMonthCount] = useState<3 | 6>(6)
  const statementsQuery = useStatements()
  const availablePeriods = useMemo(
    () =>
      (statementsQuery.data ?? [])
        .map((period) => period.periodName?.trim())
        .filter((period): period is string => Boolean(period)),
    [statementsQuery.data]
  )
  const previousPeriods = useMemo(() => {
    if (!selectedPeriod) return []
    const sorted = Array.from(new Set([...availablePeriods, selectedPeriod])).sort(comparePeriods)
    const currentIndex = sorted.indexOf(selectedPeriod)
    if (currentIndex <= 0) return []
    return sorted.slice(Math.max(0, currentIndex - monthCount), currentIndex)
  }, [availablePeriods, selectedPeriod, monthCount])

  const comparisonQuery = useQuery({
    queryKey: ['weekly-spending-comparison', account, selectedPeriod, monthCount, ...previousPeriods],
    queryFn: async () => {
      const responses = await Promise.all(
        previousPeriods.map((period) => fetchAccountTransactions(account, { statementPeriod: period }))
      )
      return responses.flatMap((response) => response.transactions ?? [])
    },
    enabled: Boolean(account && selectedPeriod && previousPeriods.length > 0),
    placeholderData: (previous) => previous ?? [],
  })

  const comparisonTransactions = comparisonQuery.data ?? []
  const currentWeeks = useCalculateWeeks(transactions)
  const comparisonWeeks = useCalculateWeeks(comparisonTransactions)
  const currentWeekCount = currentWeeks.length
  const comparisonWeekCount = comparisonWeeks.length

  const gasTransactions = transactions.filter((t) => classifyMetric(t.category) === 'gas')
  const gasTotal = sumAmounts(gasTransactions)
  const gasWeeklyAverage = currentWeekCount > 0 ? gasTotal / currentWeekCount : 0
  const gasComparisonTransactions = comparisonTransactions.filter((t) => classifyMetric(t.category) === 'gas')
  const gasComparisonTotal = sumAmounts(gasComparisonTransactions)
  const gasComparisonWeeklyAverage = comparisonWeekCount > 0 ? gasComparisonTotal / comparisonWeekCount : 0
  const gasTrend = buildTrend(gasWeeklyAverage, gasComparisonWeeklyAverage)

  const diningOutTransactions = transactions.filter((t) => classifyMetric(t.category) === 'diningOut')
  const diningOutTotal = sumAmounts(diningOutTransactions)
  const diningOutWeeklyAverage = currentWeekCount > 0 ? diningOutTotal / currentWeekCount : 0
  const diningOutComparisonTransactions = comparisonTransactions.filter((t) => classifyMetric(t.category) === 'diningOut')
  const diningOutComparisonTotal = sumAmounts(diningOutComparisonTransactions)
  const diningOutComparisonWeeklyAverage =
    comparisonWeekCount > 0 ? diningOutComparisonTotal / comparisonWeekCount : 0
  const diningOutTrend = buildTrend(diningOutWeeklyAverage, diningOutComparisonWeeklyAverage)

  const groceriesTransactions = transactions.filter((t) => classifyMetric(t.category) === 'groceries')
  const groceriesTotal = sumAmounts(groceriesTransactions)
  const groceriesWeeklyAverage = currentWeekCount > 0 ? groceriesTotal / currentWeekCount : 0
  const groceriesComparisonTransactions = comparisonTransactions.filter((t) => classifyMetric(t.category) === 'groceries')
  const groceriesComparisonTotal = sumAmounts(groceriesComparisonTransactions)
  const groceriesComparisonWeeklyAverage =
    comparisonWeekCount > 0 ? groceriesComparisonTotal / comparisonWeekCount : 0
  const groceriesTrend = buildTrend(groceriesWeeklyAverage, groceriesComparisonWeeklyAverage)

  const socialTransactions = transactions.filter((t) => classifyMetric(t.category) === 'social')
  const socialTotal = sumAmounts(socialTransactions)
  const socialWeeklyAverage = currentWeekCount > 0 ? socialTotal / currentWeekCount : 0
  const socialComparisonTransactions = comparisonTransactions.filter((t) => classifyMetric(t.category) === 'social')
  const socialComparisonTotal = sumAmounts(socialComparisonTransactions)
  const socialComparisonWeeklyAverage =
    comparisonWeekCount > 0 ? socialComparisonTotal / comparisonWeekCount : 0
  const socialTrend = buildTrend(socialWeeklyAverage, socialComparisonWeeklyAverage)

  const foodWeeklyAverage = diningOutWeeklyAverage + groceriesWeeklyAverage
  const foodComparisonWeeklyAverage = diningOutComparisonWeeklyAverage + groceriesComparisonWeeklyAverage
  const foodTotal = diningOutTotal + groceriesTotal
  const foodTrend = buildTrend(foodWeeklyAverage, foodComparisonWeeklyAverage)

  const [modalMetric, setModalMetric] = useState<MetricKey | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const modalTransactions = useMemo(() => {
    if (!modalMetric) return []
    return transactions.filter((t) => classifyMetric(t.category) === modalMetric)
  }, [modalMetric, transactions])

  const modalTitle = modalMetric === 'diningOut'
    ? 'Dining Out Transactions'
    : modalMetric
      ? `${modalMetric.charAt(0).toUpperCase() + modalMetric.slice(1)} Transactions`
      : ''

  return (
    <>
      <div style={{ padding: '6px 6px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 950, letterSpacing: '0.02em' }}>Weekly Spending Averages</div>
            <div style={{ color: 'rgba(230,238,248,0.65)', fontSize: 12 }}>
              Trend vs previous {monthCount} months
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[6, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setMonthCount(count as 3 | 6)}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '6px 10px',
                  background: monthCount === count ? '#23242a' : 'rgba(255,255,255,0.05)',
                  color: monthCount === count ? '#8db0ff' : 'rgba(230,238,248,0.78)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {count} mo
              </button>
            ))}
          </div>
        </div>
      </div>
      {isPending && <p className="tt-empty">Loading transactions...</p>}
      {isError && <p className="tt-error">Failed to load transactions for averages.</p>}
      {!isPending && !isError && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            padding: 6,
          }}
        >
          <div
            className="tt-row"
            role="button"
            tabIndex={0}
            onClick={() => { setModalMetric('gas'); setModalOpen(true) }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('gas'); setModalOpen(true) } }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 18,
              minHeight: 120,
              background: 'rgba(20,22,28,0.95)',
              borderRadius: 16,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              outline: 'none',
              transition: 'box-shadow 0.18s',
            }}
            aria-label="Show gas transactions"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, color: '#8db0ff' }}>
              <span>⛽</span> <span>Gas</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 36, color: '#8db0ff', margin: '8px 0 0 0', letterSpacing: '-0.01em', textAlign: 'center' }}>
              {formatMoney(gasWeeklyAverage)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.60)', marginTop: 4, textAlign: 'center' }}>
              {currentWeekCount} weeks · {formatMoney(gasTotal)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: trendTone(gasTrend.direction) }}>
              {gasTrend.direction === 'growing' ? '↑' : gasTrend.direction === 'decreasing' ? '↓' : '•'}{' '}
              {gasTrend.percent == null ? '0%' : `${Math.abs(gasTrend.percent).toFixed(1)}%`}
            </div>
          </div>
          <div
            className="tt-row"
            role="button"
            tabIndex={0}
            onClick={() => { setModalMetric('food'); setModalOpen(true) }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('food'); setModalOpen(true) } }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 18,
              minHeight: 120,
              background: 'rgba(28,24,12,0.95)',
              borderRadius: 16,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              outline: 'none',
              transition: 'box-shadow 0.18s',
            }}
            aria-label="Show food transactions"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, color: '#ffe6b0' }}>
              <span>🍽️🥗</span> <span>Food</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 36, color: '#ffe6b0', margin: '8px 0 0 0', letterSpacing: '-0.01em', textAlign: 'center' }}>
              {formatMoney(diningOutWeeklyAverage + groceriesWeeklyAverage)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.60)', marginTop: 4, textAlign: 'center' }}>
              {currentWeekCount} weeks · {formatMoney(foodTotal)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: trendTone(foodTrend.direction) }}>
              {foodTrend.direction === 'growing' ? '↑' : foodTrend.direction === 'decreasing' ? '↓' : '•'}{' '}
              {foodTrend.percent == null ? '0%' : `${Math.abs(foodTrend.percent).toFixed(1)}%`}
            </div>
          </div>
          <div
            className="tt-row"
            role="button"
            tabIndex={0}
            onClick={() => { setModalMetric('diningOut'); setModalOpen(true) }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('diningOut'); setModalOpen(true) } }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 18,
              minHeight: 120,
              background: 'rgba(28,16,12,0.95)',
              borderRadius: 16,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              outline: 'none',
              transition: 'box-shadow 0.18s',
            }}
            aria-label="Show dining out transactions"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, color: '#ffb08d' }}>
              <span>🍽️</span> <span>Dining Out</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 36, color: '#ffb08d', margin: '8px 0 0 0', letterSpacing: '-0.01em', textAlign: 'center' }}>
              {formatMoney(diningOutWeeklyAverage)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.60)', marginTop: 4, textAlign: 'center' }}>
              {currentWeekCount} weeks · {formatMoney(diningOutTotal)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: trendTone(diningOutTrend.direction) }}>
              {diningOutTrend.direction === 'growing' ? '↑' : diningOutTrend.direction === 'decreasing' ? '↓' : '•'}{' '}
              {diningOutTrend.percent == null ? '0%' : `${Math.abs(diningOutTrend.percent).toFixed(1)}%`}
            </div>
          </div>
          <div
            className="tt-row"
            role="button"
            tabIndex={0}
            onClick={() => { setModalMetric('groceries'); setModalOpen(true) }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('groceries'); setModalOpen(true) } }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 18,
              minHeight: 120,
              background: 'rgba(16,28,12,0.95)',
              borderRadius: 16,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              outline: 'none',
              transition: 'box-shadow 0.18s',
            }}
            aria-label="Show groceries transactions"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, color: '#b0ff8d' }}>
              <span>🛒</span> <span>Groceries</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 36, color: '#b0ff8d', margin: '8px 0 0 0', letterSpacing: '-0.01em', textAlign: 'center' }}>
              {formatMoney(groceriesWeeklyAverage)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.60)', marginTop: 4, textAlign: 'center' }}>
              {currentWeekCount} weeks · {formatMoney(groceriesTotal)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: trendTone(groceriesTrend.direction) }}>
              {groceriesTrend.direction === 'growing' ? '↑' : groceriesTrend.direction === 'decreasing' ? '↓' : '•'}{' '}
              {groceriesTrend.percent == null ? '0%' : `${Math.abs(groceriesTrend.percent).toFixed(1)}%`}
            </div>
          </div>
          <div
            className="tt-row"
            role="button"
            tabIndex={0}
            onClick={() => { setModalMetric('social'); setModalOpen(true) }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('social'); setModalOpen(true) } }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 18,
              minHeight: 120,
              background: 'rgba(28,12,40,0.95)',
              borderRadius: 16,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              outline: 'none',
              transition: 'box-shadow 0.18s',
            }}
            aria-label="Show social transactions"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, color: '#b08dff' }}>
              <span>🎉</span> <span>Social</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 36, color: '#b08dff', margin: '8px 0 0 0', letterSpacing: '-0.01em', textAlign: 'center' }}>
              {formatMoney(socialWeeklyAverage)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.60)', marginTop: 4, textAlign: 'center' }}>
              {currentWeekCount} weeks · {formatMoney(socialTotal)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: trendTone(socialTrend.direction) }}>
              {socialTrend.direction === 'growing' ? '↑' : socialTrend.direction === 'decreasing' ? '↓' : '•'}{' '}
              {socialTrend.percent == null ? '0%' : `${Math.abs(socialTrend.percent).toFixed(1)}%`}
            </div>
          </div>
        </div>
      )}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setModalMetric(null) }}
        title={modalTitle}
      >
        <TransactionList transactions={modalTransactions} />
      </Modal>
    </>
  )
}
