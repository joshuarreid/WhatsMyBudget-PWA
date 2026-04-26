import type { BudgetTransaction } from '../../../api/transactions/transactions.types'

interface TransactionListProps {
  transactions: BudgetTransaction[]
}

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const formatDate = (value: string | undefined) => {
  if (!value) return ''
  const dt = new Date(value)
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : value
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  if (transactions.length === 0) {
    return null // Render nothing for empty state
  }

  return (
    <div className="tt-crit-txns-list">
      {transactions.map((transaction, idx) => {
        const title = transaction.description || transaction.name || 'Transaction'
        const category = String((transaction as any).category ?? '').trim()
        const amountClass = transaction.amount < 0 ? 'tt-row-amount-neg' : 'tt-row-amount-pos'
        const key = transaction.id ?? `actual-${idx}`
        const dateValue = (transaction as any).date ?? transaction.transactionDate

        return (
          <div key={key} className="tt-row tt-crit-txn-row">
            <div className="tt-row-top">
              <div className="tt-crit-title-stack">
                <strong className="tt-row-title tt-crit-title-ellipsis">{title}</strong>
                {category && <div className="tt-crit-subline tt-crit-title-ellipsis">{category}</div>}
              </div>
              <div className="tt-crit-right-stack">
                <strong className={amountClass}>{formatCurrency(Math.abs(transaction.amount))}</strong>
                <div className="tt-crit-subline tt-crit-right-sub">{formatDate(dateValue)}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
