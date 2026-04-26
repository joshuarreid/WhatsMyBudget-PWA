import { useMemo } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { useTransactions } from '../features/transactions/hooks/useTransactions'
import { useProjectedTransactions } from '../features/projectedTransactions/hooks/useProjectedTransactions'
import { TransactionList } from '../features/transactions/components/TransactionList'
import { ProjectedTransactionList } from '../features/projectedTransactions/components/ProjectedTransactionList'
import { useCriticalitySummaries } from '../features/transactions/hooks/useCriticalitySummaries'
import { CriticalitySummaryWidget } from '../features/transactions/components/CriticalitySummaryWidget'
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
  const { data: projectedTransactions, isPending: projectedLoading } = useProjectedTransactions(selectedAccount, filters)

  const {
    data: criticalityDetails,
    isPending: criticalityPending,
    isError: criticalityError,
  } = useCriticalitySummaries(selectedAccount, selectedPeriod)

  const sortedActualTransactions = useMemo(() => {
    const list = transactions?.transactions ?? []
    return [...list].sort((a, b) => {
      const aDate = (a as any).date ?? a.transactionDate
      const bDate = (b as any).date ?? b.transactionDate
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }, [transactions])

  const sortedProjectedTransactions = useMemo(() => {
    const list = projectedTransactions?.projectedTransactions ?? []
    return [...list].sort((a, b) => {
      const aDate =
        (a as any).projectedDate ?? (a as any).projectedTransactionDate ?? (a as any).transactionDate
      const bDate =
        (b as any).projectedDate ?? (b as any).projectedTransactionDate ?? (b as any).transactionDate
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
              {criticalityError && (
                <p className="tt-error">Failed to load criticality summary.</p>
              )}
              {criticalityDetails && (
                <CriticalitySummaryWidget
                  account={selectedAccount}
                  statementPeriod={selectedPeriod}
                  essential={criticalityDetails.summaries.essential}
                  nonessential={criticalityDetails.summaries.nonessential}
                  essentialByCategory={criticalityDetails.essential.byCategory}
                  nonessentialByCategory={criticalityDetails.nonessential.byCategory}
                  essentialActual={criticalityDetails.essential.actual}
                  essentialProjected={criticalityDetails.essential.projected}
                  nonessentialActual={criticalityDetails.nonessential.actual}
                  nonessentialProjected={criticalityDetails.nonessential.projected}
                />
              )}
            </div>
          )}
          <div className="tt-subcard">
            {projectedLoading && <p className="tt-empty">Loading projected transactions...</p>}
            <div className="tt-body">
              {projectedTransactions ? (
                <ProjectedTransactionList transactions={sortedProjectedTransactions} />
              ) : (
                <div className="tt-empty" />
              )}
            </div>
          </div>
          <div className="tt-subcard">
            {transactionsLoading && <p className="tt-empty">Loading transactions...</p>}
            <div className="tt-body">
              {transactions ? (
                <TransactionList transactions={sortedActualTransactions} />
              ) : (
                <div className="tt-empty" />
              )}
        </div>
      </div>
    </MainLayout>
  )
}
