import { useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import type { BudgetTransaction } from '../api/transactions.types.ts'
import { useCalculateWeeks } from '../hooks/useCalculateWeeks'
import { useWeeklyAverage } from '../hooks/useWeeklyAverage'
import { TransactionList } from './TransactionList'

type MetricKey = 'food' | 'gas' | 'social' | 'diningOut' | 'groceries'

type SpendingAveragesStatCardsProps = {
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

export const SpendingAveragesStatCards = ({ transactions, isPending, isError }: SpendingAveragesStatCardsProps) => {
  const gasTransactions = transactions.filter((t) => classifyMetric(t.category) === 'gas')
  const gasWeeks = useCalculateWeeks(gasTransactions)
  const gasWeeklyAverage = useWeeklyAverage(gasWeeks)

  const diningOutTransactions = transactions.filter((t) => classifyMetric(t.category) === 'diningOut')
  const diningOutWeeks = useCalculateWeeks(diningOutTransactions)
  const diningOutWeeklyAverage = useWeeklyAverage(diningOutWeeks)

  const groceriesTransactions = transactions.filter((t) => classifyMetric(t.category) === 'groceries')
  const groceriesWeeks = useCalculateWeeks(groceriesTransactions)
  const groceriesWeeklyAverage = useWeeklyAverage(groceriesWeeks)

  const socialTransactions = transactions.filter((t) => classifyMetric(t.category) === 'social')
  const socialWeeks = useCalculateWeeks(socialTransactions)
  const socialWeeklyAverage = useWeeklyAverage(socialWeeks)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMetric, setModalMetric] = useState<MetricKey | null>(null)

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
        <div style={{ fontWeight: 950, letterSpacing: '0.02em' }}>Weekly Spending Averages</div>
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
              {gasWeeks.length} weeks · {formatMoney(gasWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
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
              {Math.max(diningOutWeeks.length, groceriesWeeks.length)} weeks · {formatMoney(diningOutWeeks.reduce((sum, w) => sum + w.totalAmount, 0) + groceriesWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
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
              {diningOutWeeks.length} weeks · {formatMoney(diningOutWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
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
              {groceriesWeeks.length} weeks · {formatMoney(groceriesWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
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
              {socialWeeks.length} weeks · {formatMoney(socialWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}
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
