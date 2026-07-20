import { useMemo } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { useTransactions, useCriticalitySummaries, TriRingStat, SpendingAveragesStatCards, NestedCategoryTable } from '@/features/transactions'
import { useProfileStore } from '../store/useProfileStore'
import { useStatementPeriodStore } from '../store/useStatementPeriodStore'
import './DashboardPage.css'

export const DashboardPage = () => {
  const selectedAccount = useProfileStore((state) => state.profile)
  const selectedPeriod = useStatementPeriodStore(s => s.selectedPeriod)

  const filters = useMemo(() => {
    return selectedPeriod ? { statementPeriod: selectedPeriod } : undefined
  }, [selectedPeriod])

  const { data: transactions, isPending: transactionsLoading, isError: transactionsError } = useTransactions(selectedAccount, filters)
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
              <SpendingAveragesStatCards
                account={selectedAccount}
                selectedPeriod={selectedPeriod}
                transactions={sortedActualTransactions}
                isPending={transactionsLoading}
                isError={transactionsError}
              />
              <NestedCategoryTable
                account={selectedAccount}
                statementPeriod={selectedPeriod}
                actualTransactions={sortedActualTransactions}
                transactions={[]}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
