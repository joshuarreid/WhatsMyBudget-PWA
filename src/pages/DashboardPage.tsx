import { useMemo } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { useTransactions, useCriticalitySummaries, TriRingStat, NestedCategoryTable, TransactionList } from '@/features/transactions'
import { useProjectedTransactions } from '@/features/projectedTransactions'
import { useProfileStore } from '../store/useProfileStore'
import { useStatementPeriodStore } from '../store/useStatementPeriodStore'
import './DashboardPage.css'

export const DashboardPage = () => {
  const selectedAccount = useProfileStore((state) => state.profile)
  const selectedPeriod = useStatementPeriodStore(s => s.selectedPeriod)

  const filters = useMemo(() => {
    return selectedPeriod ? { statementPeriod: selectedPeriod } : undefined
  }, [selectedPeriod])

  const { data: transactions, isPending: transactionsLoading } = useTransactions(selectedAccount, filters)
  const { data: projectedTransactions } = useProjectedTransactions(selectedAccount, filters)
  const {
    data: criticalityDetails,
    isPending: criticalityPending,
    isError: criticalityError,
  } = useCriticalitySummaries(selectedAccount, selectedPeriod)

  const sortedActualTransactions = useMemo(() => {
    const list = transactions?.transactions ?? []
    return [...list].sort((a, b) => {
      const aDate = a.transactionDate
      const bDate = b.transactionDate
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }, [transactions])

  const sortedProjectedTransactions = useMemo(() => {
    const list = projectedTransactions?.projectedTransactions ?? []
    return [...list].sort((a, b) => {
      const aDate = a.projectedDate ?? a.projectedTransactionDate
      const bDate = b.projectedDate ?? b.projectedTransactionDate
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }, [projectedTransactions])

  return (
    <MainLayout>
      <div className="dashboard-page-root">
        <div className="tt-card">
          {selectedPeriod && (
            <div className="tt-subcard">
              {criticalityPending && <p className="tt-empty">Loading criticality summary...</p>}
              {criticalityError && <p className="tt-error">Failed to load criticality summary.</p>}
              {criticalityDetails && (
                <TriRingStat
                  planned={criticalityDetails.summaries.planned}
                  essential={criticalityDetails.summaries.essential}
                  nonessential={criticalityDetails.summaries.nonessential}
                />
              )}
              <NestedCategoryTable
                account={selectedAccount}
                statementPeriod={selectedPeriod}
                actualTransactions={sortedActualTransactions}
                transactions={sortedProjectedTransactions}
              />
            </div>
          )}
          <div className="tt-subcard">
            <div className="tt-section-title">Posted Transactions</div>
            {transactionsLoading && <p className="tt-empty">Loading transactions...</p>}
            <div className="tt-body">
              {transactions ? (
                <TransactionList transactions={sortedActualTransactions} />
              ) : (
                <div className="tt-empty" />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
