import { useMemo, useState, type CSSProperties } from 'react'
import type { CriticalitySummary } from '../../../api/transactions/criticalitySummary.types'
import type { CategoryBreakdownRow } from '../hooks/useCriticalitySummaries'
import type { BudgetTransaction } from '../../../api/transactions/transactions.types'
import type { ProjectedTransaction } from '../../../api/projectedTransactions/projectedTransactions.types'
import { Modal } from '../../../components/Modal'

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const ringStyle = (projectedFraction: number, colorActual: string, colorProjected: string): CSSProperties => {
  // actual portion, projected portion
  const projected = clamp01(projectedFraction)
  const projectedDeg = projected * 360

  return {
    background: `conic-gradient(${colorProjected} 0deg ${projectedDeg}deg, ${colorActual} ${projectedDeg}deg 360deg)`,
  }
}

const RingStat = (props: { label: string; summary: CriticalitySummary }) => {
  const totalAmount = props.summary.actualTotal + props.summary.projectedTotal
  const projectedFraction = totalAmount === 0 ? 0 : props.summary.projectedTotal / totalAmount

  // Use blue for nonessential, green for essential
  const isNonessential = props.label.toLowerCase().includes('nonessential')
  const colorActual = isNonessential ? '#3b82f6' : '#1fbf75'
  const colorProjected = '#f5c542'

  return (
    <div className="tt-crit-stat tt-crit-ring-box">
      <div className="tt-crit-title">{props.label}</div>
      <div className="tt-crit-ring" style={ringStyle(projectedFraction, colorActual, colorProjected)}>
        <div className="tt-crit-ring-inner">
          <div className="tt-crit-amount">{formatCurrency(totalAmount)}</div>
        </div>
      </div>
    </div>
  )
}

const DualRingStat = (props: {
  essential: CriticalitySummary
  nonessential: CriticalitySummary
}) => {
  const totalEssential = props.essential.actualTotal + props.essential.projectedTotal
  const projectedFractionEssential = totalEssential === 0 ? 0 : props.essential.projectedTotal / totalEssential
  const totalNonessential = props.nonessential.actualTotal + props.nonessential.projectedTotal
  const projectedFractionNonessential = totalNonessential === 0 ? 0 : props.nonessential.projectedTotal / totalNonessential

  return (
    <div className="tt-crit-stat tt-crit-dual-ring">
      <div className="tt-crit-dual-ring-inner">
        <div className="tt-crit-ring-box">
          <div className="tt-crit-title">Essential</div>
          <div className="tt-crit-ring" style={ringStyle(projectedFractionEssential, '#1fbf75', '#f5c542')}>
            <div className="tt-crit-ring-inner">
              <div className="tt-crit-amount">{formatCurrency(totalEssential)}</div>
            </div>
          </div>
        </div>
        <div className="tt-crit-ring-box">
          <div className="tt-crit-title">Nonessential</div>
          <div className="tt-crit-ring" style={ringStyle(projectedFractionNonessential, '#3b82f6', '#f5c542')}>
            <div className="tt-crit-ring-inner">
              <div className="tt-crit-amount">{formatCurrency(totalNonessential)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const formatDate = (value: string | undefined) => {
  if (!value) return ''
  const dt = new Date(value)
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : value
}

const normalizeCategory = (value: unknown) => String(value ?? 'Uncategorized').trim() || 'Uncategorized'

const TxnList = (props: {
  title: string
  variant: 'actual' | 'projected'
  items: Array<{ id?: string | number; date?: string; description?: string; amount: number }>
}) => {
  return (
    <div className="tt-crit-txns-section">
      <div className="tt-crit-txns-title">{props.title}</div>
      {props.items.length === 0 ? (
        <div className="tt-empty">None</div>
      ) : (
        <div className="tt-crit-txns-list">
          {props.items.map((t, idx) => {
            const key = t.id ?? `${props.variant}-${idx}`
            return (
              <div key={key} className={`tt-row tt-crit-txn-row ${props.variant === 'projected' ? 'tt-row-projected' : ''}`}>
                <div className="tt-row-top">
                  <strong className="tt-row-title">{t.description || 'Transaction'}</strong>
                  <strong className={props.variant === 'projected' ? 'tt-crit-projected' : 'tt-crit-actual'}>
                    {formatCurrency(t.amount)}
                  </strong>
                </div>
                <div className="tt-row-meta">
                  <div>{formatDate(t.date)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const BreakdownTable = (props: {
  rows: CategoryBreakdownRow[]
  onSelectCategory: (category: string) => void
}) => {
  if (props.rows.length === 0) {
    return <div className="tt-empty">No transactions in this bucket.</div>
  }

  return (
    <div className="tt-crit-table-wrap">
      <table className="tt-crit-table">
        <thead>
          <tr>
            <th>Category</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => {
            const hasProjected = Math.abs(r.projectedTotal) > 0
            return (
              <tr
                key={r.category}
                className={hasProjected ? 'tt-crit-row-projected' : undefined}
                role="button"
                tabIndex={0}
                onClick={() => props.onSelectCategory(r.category)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') props.onSelectCategory(r.category)
                }}
              >
                <td className="tt-crit-cat">{r.category}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="tt-crit-actual-amt">{formatCurrency(r.actualTotal)}</span>
                  {hasProjected && (
                    <span className="tt-crit-projected-amt"> + {formatCurrency(r.projectedTotal)}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export const CriticalitySummaryWidget = (props: {
  account: string
  statementPeriod: string
  essential: CriticalitySummary
  nonessential: CriticalitySummary
  essentialByCategory: CategoryBreakdownRow[]
  nonessentialByCategory: CategoryBreakdownRow[]
  essentialActual: BudgetTransaction[]
  essentialProjected: ProjectedTransaction[]
  nonessentialActual: BudgetTransaction[]
  nonessentialProjected: ProjectedTransaction[]
}) => {
  const [tab, setTab] = useState<'essential' | 'nonessential'>('essential')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const activeRows = tab === 'essential' ? props.essentialByCategory : props.nonessentialByCategory
  const activeActual = tab === 'essential' ? props.essentialActual : props.nonessentialActual
  const activeProjected = tab === 'essential' ? props.essentialProjected : props.nonessentialProjected

  const categoryActualTxns = useMemo(() => {
    if (!selectedCategory) return []
    const cat = normalizeCategory(selectedCategory)
    return activeActual
      .filter((t) => normalizeCategory((t as any).category) === cat)
      .map((t) => ({
        id: (t as any).id,
        date: (t as any).date ?? (t as any).transactionDate,
        description: (t as any).description ?? (t as any).name,
        amount: Number((t as any).amount) || 0,
      }))
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
  }, [activeActual, selectedCategory])

  const categoryProjectedTxns = useMemo(() => {
    if (!selectedCategory) return []
    const cat = normalizeCategory(selectedCategory)
    return activeProjected
      .filter((t) => normalizeCategory((t as any).category) === cat)
      .map((t) => ({
        id: (t as any).id,
        date: (t as any).date ?? (t as any).transactionDate,
        description: (t as any).description ?? (t as any).name,
        amount: Number((t as any).amount) || 0,
      }))
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
  }, [activeProjected, selectedCategory])

  return (
    <div>
      <DualRingStat essential={props.essential} nonessential={props.nonessential} />
      <div className="tt-crit-modal-tabs" style={{ marginTop: 24, marginBottom: 8 }}>
        <button
          type="button"
          className={`tt-pill tt-crit-tab ${tab === 'essential' ? 'tt-crit-tab-active' : ''}`}
          onClick={() => {
            setTab('essential')
            setSelectedCategory(null)
          }}
        >
          Essential
        </button>
        <button
          type="button"
          className={`tt-pill tt-crit-tab ${tab === 'nonessential' ? 'tt-crit-tab-active' : ''}`}
          onClick={() => {
            setTab('nonessential')
            setSelectedCategory(null)
          }}
        >
          Nonessential
        </button>
      </div>
      <div className="tt-crit-modal-content" role="region" aria-label="Category breakdown">
        <BreakdownTable rows={activeRows} onSelectCategory={(c) => { setSelectedCategory(c); setModalOpen(true); }} />
      </div>
      <Modal
        isOpen={modalOpen && !!selectedCategory}
        title={selectedCategory ? `Transactions for ${selectedCategory}` : ''}
        onClose={() => { setModalOpen(false); setSelectedCategory(null); }}
      >
        <TxnList title="Projected" variant="projected" items={categoryProjectedTxns} />
        <TxnList title="Transactions" variant="actual" items={categoryActualTxns} />
      </Modal>
    </div>
  )
}
