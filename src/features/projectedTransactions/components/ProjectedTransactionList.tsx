import type { ProjectedTransaction } from '../../../api/projectedTransactions/projectedTransactions.types'

interface ProjectedTransactionListProps {
  transactions?: ProjectedTransaction[]
}

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export const ProjectedTransactionList = ({ transactions }: ProjectedTransactionListProps) => {
  const safeTransactions = transactions ?? []

  if (safeTransactions.length === 0) {
    return null // Render nothing for empty state
  }

  return (
    <div className="tt-crit-txns-list">
      {safeTransactions.map((transaction: any, idx: number) => {
        const title = transaction.description || transaction.name || 'Projected Transaction'
        const category = String(transaction.category ?? '').trim()
        const amountClass = transaction.amount < 0 ? 'tt-row-amount-neg' : 'tt-row-amount-pos'
        const key = transaction.id ?? `projected-${idx}`

        return (
          <div key={key} className="tt-row tt-row-projected tt-crit-txn-row">
            <div className="tt-row-top">
              <div className="tt-crit-title-stack">
                <strong className="tt-row-title tt-crit-title-ellipsis">{title}</strong>
                {category && <div className="tt-crit-subline tt-crit-title-ellipsis">{category}</div>}
              </div>
              <strong className={amountClass}>{formatCurrency(Math.abs(transaction.amount))}</strong>
            </div>
          </div>
        )
      })}
    </div>
  )
}
