import type { CSSProperties } from 'react'
import type { CriticalitySummary } from '../../../api/transactions/criticalitySummary.types'

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

export const CriticalitySummaryWidget = (props: {
  account: string
  statementPeriod: string
  essential: CriticalitySummary
  nonessential: CriticalitySummary
}) => {
  return (
    <div className="tt-crit-widget">

      <div className="tt-crit-grid">
        <RingStat label="Essential" summary={props.essential} />
        <RingStat label="Nonessential" summary={props.nonessential} />
      </div>
    </div>
  )
}
