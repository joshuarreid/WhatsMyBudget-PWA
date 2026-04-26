import type { ProjectedTransaction } from '../../../api/projectedTransactions/projectedTransactions.types'
import { useDeleteProjectedTransaction } from '../hooks/useProjectedTransactions'

interface ProjectedTransactionListProps {
  transactions?: ProjectedTransaction[]
}

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export const ProjectedTransactionList = ({ transactions }: ProjectedTransactionListProps) => {
  const deleteMutation = useDeleteProjectedTransaction()

  const safeTransactions = transactions ?? []

  if (safeTransactions.length === 0) {
    return null // Render nothing for empty state
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this projected transaction?')) {
      deleteMutation.mutate(String(id))
    }
  }

  return (
    <div className="tt-crit-txns-list">
      {safeTransactions.map((transaction: any) => {
        const title = transaction.description || transaction.name || 'Projected Transaction'
        const dateValue =
          transaction.projectedDate || transaction.projectedTransactionDate || transaction.transactionDate
        const amountClass = transaction.amount < 0 ? 'tt-row-amount-neg' : 'tt-row-amount-pos'

        return (
          <div key={transaction.id} className="tt-row tt-row-projected tt-crit-txn-row">
            <div className="tt-row-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span className="tt-badge">Projected</span>
                <strong className="tt-row-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </strong>
              </div>
              <strong className={amountClass}>{formatCurrency(Math.abs(transaction.amount))}</strong>
            </div>

            <div className="tt-row-meta">
              <div>
                {transaction.category} • {transaction.account}
              </div>
              {dateValue && <div>{new Date(dateValue).toLocaleDateString()}</div>}
            </div>

            {transaction.id != null && (
              <button type="button" className="tt-crit-delete" onClick={() => handleDelete(transaction.id)}>
                Delete
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
