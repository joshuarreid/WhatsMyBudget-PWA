import type { ProjectedTransaction } from '../../../api/projectedTransactions/projectedTransactions.types'
import { useDeleteProjectedTransaction } from '../hooks/useProjectedTransactions'

interface ProjectedTransactionListProps {
  transactions?: ProjectedTransaction[]
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {safeTransactions.map((transaction: any) => {
        const title = transaction.description || transaction.name || 'Projected Transaction'
        const dateValue =
          transaction.projectedDate || transaction.projectedTransactionDate || transaction.transactionDate
        const amountClass = transaction.amount < 0 ? 'tt-row-amount-neg' : 'tt-row-amount-pos'

        return (
          <div key={transaction.id} className="tt-row tt-row-projected">
            <div className="tt-row-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span className="tt-badge">Projected</span>
                <strong className="tt-row-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </strong>
              </div>
              <strong className={amountClass}>${Math.abs(transaction.amount).toFixed(2)}</strong>
            </div>

            <div className="tt-row-meta">
              <div>
                {transaction.category} • {transaction.account}
              </div>
              {dateValue && <div>{new Date(dateValue).toLocaleDateString()}</div>}
            </div>

            {transaction.id != null && (
              <button
                onClick={() => handleDelete(transaction.id)}
                style={{
                  marginTop: '8px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
