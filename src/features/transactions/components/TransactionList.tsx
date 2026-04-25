import type { BudgetTransaction } from '../../../api/transactions/transactions.types'

interface TransactionListProps {
  transactions: BudgetTransaction[]
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  if (transactions.length === 0) {
    return null // Render nothing for empty state
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {transactions.map((transaction) => {
        const title = transaction.description || transaction.name || 'Transaction'
        const dateValue = (transaction as any).date ?? transaction.transactionDate
        const amountClass = transaction.amount < 0 ? 'tt-row-amount-neg' : 'tt-row-amount-pos'

        return (
          <div key={transaction.id} className="tt-row">
            <div className="tt-row-top">
              <strong className="tt-row-title">{title}</strong>
              <strong className={amountClass}>${Math.abs(transaction.amount).toFixed(2)}</strong>
            </div>
            <div className="tt-row-meta">
              <div>
                {transaction.category} • {transaction.account}
              </div>
              <div>{new Date(dateValue).toLocaleDateString()}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
