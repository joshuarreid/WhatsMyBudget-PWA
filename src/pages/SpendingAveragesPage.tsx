import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { useCurrentStatementPeriod } from '../features/statements/hooks/useCurrentStatementPeriod'
import { useTransactions } from '../features/transactions/hooks/useTransactions'
import { useCalculateWeeks } from '../features/transactions/hooks/useCalculateWeeks'
import { useWeeklyAverage } from '../features/transactions/hooks/useWeeklyAverage'
import './DashboardPage.css'
import { TransactionList } from '../features/transactions/components/TransactionList'
import { Modal } from '../components/Modal'
import type { BudgetTransaction } from '../api/transactions/transactions.types'
import { useProfileStore } from '../store/useProfileStore'

type ParsedStatementPeriod = {
  monthIndex: number
  year: number
}

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

const parseStatementPeriod = (period: string): ParsedStatementPeriod | null => {
  const match = /^([A-Z]+)(\d{4})$/.exec(period.trim().toUpperCase())
  if (!match) return null

  const monthName = match[1] as MonthName
  const monthIndex = MONTHS.indexOf(monthName)
  if (monthIndex === -1) return null

  const year = Number(match[2])
  if (!Number.isFinite(year)) return null

  return { monthIndex, year }
}

const formatStatementPeriod = (monthIndex: number, year: number): string => {
  return `${MONTHS[monthIndex]}${year}`
}

const addMonths = (value: ParsedStatementPeriod, deltaMonths: number): ParsedStatementPeriod => {
  const total = value.year * 12 + value.monthIndex + deltaMonths
  const year = Math.floor(total / 12)
  const monthIndex = ((total % 12) + 12) % 12
  return { year, monthIndex }
}

const buildStatementPeriodWindow = (current: string | null | undefined, monthsBack: number): string[] => {
  if (!current) return []
  const parsed = parseStatementPeriod(current)
  if (!parsed) return []

  const periods: string[] = []
  for (let offset = -monthsBack; offset <= 0; offset++) {
    const p = addMonths(parsed, offset)
    periods.push(formatStatementPeriod(p.monthIndex, p.year))
  }

  return periods
}

// Utility functions for metrics
function formatMoney(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

type MetricKey = 'food' | 'gas' | 'social' | 'nonperishables' | 'diningOut' | 'groceries'

function classifyMetric(category: string): MetricKey | null {
  // Only match exact category (case-insensitive) for Dining Out and Groceries
  if (category.trim().toLowerCase() === 'dining out') return 'diningOut'
  if (category.trim().toLowerCase() === 'groceries') return 'groceries'
  const cat = category.toLowerCase()
  if (cat.includes('gas')) return 'gas'
  if (cat.includes('food')) return 'food'
  if (cat.includes('social')) return 'social'
  if (cat.includes('nonperish')) return 'nonperishables'
  return null
}

export function SpendingAveragesPage() {
  const selectedAccount = useProfileStore((state) => state.profile)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  const {
    data: currentStatementPeriod,
    isPending: currentStatementPeriodLoading,
    isError: currentStatementPeriodError,
  } = useCurrentStatementPeriod()

  const availablePeriods = useMemo(() => {
    return buildStatementPeriodWindow(currentStatementPeriod?.statementPeriod, 4)
  }, [currentStatementPeriod])

  useEffect(() => {
    if (selectedPeriod) return
    if (availablePeriods.length === 0) return
    setSelectedPeriod(availablePeriods[4] ?? availablePeriods[availablePeriods.length - 1])
  }, [selectedPeriod, availablePeriods])

  // Fetch transactions for the selected account and statement period only
  const { data: personalTxData, isPending: personalTxPending, isError: personalTxError } = useTransactions(selectedAccount, selectedPeriod ? { statementPeriod: selectedPeriod } : undefined)
  const { data: jointTxData, isPending: jointTxPending, isError: jointTxError } = useTransactions('joint', selectedPeriod ? { statementPeriod: selectedPeriod } : undefined)

  const anyPending = currentStatementPeriodLoading || personalTxPending || jointTxPending
  const anyError = currentStatementPeriodError || personalTxError || jointTxError

  // Use only the transactions for the selected account
  const allTransactions = useMemo(() => {
    if (selectedAccount === 'joint') {
      // Use transactions from jointTxData
      return jointTxData?.transactions ?? []
    } else {
      // For personal accounts, use transactions from personalTxData
      return personalTxData?.transactions ?? []
    }
  }, [personalTxData, jointTxData, selectedAccount])

  // Calculate weeks for all transactions (for Gas, Dining Out, Groceries)
  const gasTransactions = allTransactions.filter((t: BudgetTransaction) => classifyMetric(t.category) === 'gas')
  const gasWeeks = useCalculateWeeks(gasTransactions)
  const gasWeeklyAverage = useWeeklyAverage(gasWeeks)

  const diningOutTransactions = allTransactions.filter((t: BudgetTransaction) => classifyMetric(t.category) === 'diningOut')
  const diningOutWeeks = useCalculateWeeks(diningOutTransactions)
  const diningOutWeeklyAverage = useWeeklyAverage(diningOutWeeks)

  const groceriesTransactions = allTransactions.filter((t: BudgetTransaction) => classifyMetric(t.category) === 'groceries')
  const groceriesWeeks = useCalculateWeeks(groceriesTransactions)
  const groceriesWeeklyAverage = useWeeklyAverage(groceriesWeeks)

  const socialTransactions = allTransactions.filter((t: BudgetTransaction) => classifyMetric(t.category) === 'social')
  const socialWeeks = useCalculateWeeks(socialTransactions)
  const socialWeeklyAverage = useWeeklyAverage(socialWeeks)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMetric, setModalMetric] = useState<MetricKey | null>(null)

  // Filter transactions for the selected metric
  // allTransactions is already filtered by selectedAccount and selectedPeriod via useTransactions
  // The modal further filters by the selected metric only
  const modalTransactions = useMemo(() => {
    if (!modalMetric) return []
    return allTransactions.filter((t: BudgetTransaction) => classifyMetric(t.category) === modalMetric)
  }, [modalMetric, allTransactions])

  // DEBUG: Show [Split] transactions in allTransactions for josh
  useEffect(() => {
    if (selectedAccount === 'josh' && selectedPeriod === 'APRIL2026') {
      const splitTx = allTransactions.filter((t: BudgetTransaction) => t.name?.startsWith('[Split]'))
      const splitDiningOutTx = splitTx.filter((t: BudgetTransaction) => classifyMetric(t.category) === 'diningOut')
    }
  }, [allTransactions, selectedAccount, selectedPeriod])

  // DEBUG: Show all transactions for the selected account and period
  useEffect(() => {
  }, [allTransactions, diningOutTransactions, selectedAccount, selectedPeriod])

  useEffect(() => {
  }, [personalTxData, jointTxData])

  return (
    <MainLayout>
      <div className="tt-card" style={{ minHeight: 'auto' }}>
        <div className="tt-controls">
          <div className="tt-period-controls">
            <label htmlFor="period-select" className="tt-label">
              Statement Period
            </label>

            {currentStatementPeriodLoading && <p className="tt-empty">Loading statement periods...</p>}
            {currentStatementPeriodError && <p className="tt-error">Failed to load current statement period.</p>}

            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="tt-select"
            >
              <option value="">All Periods</option>
              {availablePeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tt-subcard">
          <div style={{ padding: '6px 6px 0' }}>
            <div style={{ fontWeight: 950, letterSpacing: '0.02em' }}>Weekly Spending Averages</div>
          </div>

          {anyPending && <p className="tt-empty">Loading transactions...</p>}
          {anyError && <p className="tt-error">Failed to load transactions for averages.</p>}

          {!anyPending && !anyError && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                padding: 6,
              }}
            >
              {/* Gas Card Example */}
              <div
                className="tt-row"
                role="button"
                tabIndex={0}
                onClick={() => { setModalMetric('gas'); setModalOpen(true) }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('gas'); setModalOpen(true) } }}
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
                  {gasWeeks.length} weeks · {formatMoney(gasWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
                </div>
              </div>
              {/* Food Card */}
              <div
                className="tt-row"
                role="button"
                tabIndex={0}
                onClick={() => { setModalMetric('food'); setModalOpen(true) }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('food'); setModalOpen(true) } }}
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
                  {Math.max(diningOutWeeks.length, groceriesWeeks.length)} weeks · {formatMoney(diningOutWeeks.reduce((sum, w) => sum + w.totalAmount, 0) + groceriesWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
                </div>
              </div>
              {/* Dining Out Card */}
              <div
                className="tt-row"
                role="button"
                tabIndex={0}
                onClick={() => { setModalMetric('diningOut'); setModalOpen(true) }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('diningOut'); setModalOpen(true) } }}
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
                  {diningOutWeeks.length} weeks · {formatMoney(diningOutWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
                </div>
              </div>
              {/* Groceries Card */}
              <div
                className="tt-row"
                role="button"
                tabIndex={0}
                onClick={() => { setModalMetric('groceries'); setModalOpen(true) }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('groceries'); setModalOpen(true) } }}
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
                  {groceriesWeeks.length} weeks · {formatMoney(groceriesWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
                </div>
              </div>
              {/* Social Card */}
              <div
                className="tt-row"
                role="button"
                tabIndex={0}
                onClick={() => { setModalMetric('social'); setModalOpen(true) }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setModalMetric('social'); setModalOpen(true) } }}
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
                  {socialWeeks.length} weeks · {formatMoney(socialWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
                </div>
              </div>
              {/* ...other metric cards... */}
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setModalMetric(null) }}
        title={modalMetric ? `${modalMetric.charAt(0).toUpperCase() + modalMetric.slice(1)} Transactions` : ''}
      >
        <TransactionList transactions={modalTransactions} />
      </Modal>
    </MainLayout>
  )
}
