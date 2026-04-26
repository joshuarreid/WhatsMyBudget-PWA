import { useMemo, useState, type CSSProperties } from 'react'
import type { CriticalitySummary } from '../../../api/transactions/criticalitySummary.types'
import type { CategoryBreakdownRow } from '../hooks/useCriticalitySummaries'
import { Modal } from '../../../components/Modal'

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const ringStyle = (projectedFraction: number): CSSProperties => {
  // green portion = actual, yellow portion = projected
  const projected = clamp01(projectedFraction)
  const projectedDeg = projected * 360

  return {
    background: `conic-gradient(#f5c542 0deg ${projectedDeg}deg, #1fbf75 ${projectedDeg}deg 360deg)`,
  }
}

const RingStat = (props: { label: string; summary: CriticalitySummary }) => {
  const totalAmount = props.summary.actualTotal + props.summary.projectedTotal
  const projectedFraction = totalAmount === 0 ? 0 : props.summary.projectedTotal / totalAmount

  return (
    <div className="tt-crit-stat">
      <div className="tt-crit-title">{props.label}</div>

      <div className="tt-crit-ring" style={ringStyle(projectedFraction)}>
        <div className="tt-crit-ring-inner">
          <div className="tt-crit-amount">{formatCurrency(totalAmount)}</div>
        </div>
      </div>

      <div className="tt-crit-breakdown">
        <span className="tt-crit-actual">Actual: {formatCurrency(props.summary.actualTotal)}</span>
        <span className="tt-crit-projected">Projected: {formatCurrency(props.summary.projectedTotal)}</span>
      </div>
    </div>
  )
}

const BreakdownTable = (props: { rows: CategoryBreakdownRow[] }) => {
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
              <tr key={r.category} className={hasProjected ? 'tt-crit-row-projected' : undefined}>
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
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<'essential' | 'nonessential'>('essential')

  const modalTitle = useMemo(() => {
    const label = tab === 'essential' ? 'Essential' : 'Nonessential'
    return `${label} breakdown`
  }, [props.account, props.statementPeriod, tab])

  const activeRows = tab === 'essential' ? props.essentialByCategory : props.nonessentialByCategory

  const onWidgetOpen = () => {
    setTab('essential')
    setIsOpen(true)
  }

  return (
    <>
      <button type="button" className="tt-crit-widget tt-crit-widget-click" onClick={onWidgetOpen}>
        <div className="tt-crit-grid">
          <RingStat label="Essential" summary={props.essential} />
          <RingStat label="Nonessential" summary={props.nonessential} />
        </div>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={modalTitle}>
        <div className="tt-crit-modal-tabs">
          <button
            type="button"
            className={`tt-pill tt-crit-tab ${tab === 'essential' ? 'tt-crit-tab-active' : ''}`}
            onClick={() => setTab('essential')}
          >
            Essential
          </button>
          <button
            type="button"
            className={`tt-pill tt-crit-tab ${tab === 'nonessential' ? 'tt-crit-tab-active' : ''}`}
            onClick={() => setTab('nonessential')}
          >
            Nonessential
          </button>
        </div>

        <div className="tt-crit-modal-content" role="region" aria-label="Category breakdown">
          <BreakdownTable rows={activeRows} />
        </div>
      </Modal>
    </>
  )
}
