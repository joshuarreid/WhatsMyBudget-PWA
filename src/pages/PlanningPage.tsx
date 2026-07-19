import { useMemo } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import {
  PlanningSummaryTable,
  ProjectedTransactionList,
  useProjectedTransactions,
} from '@/features/projectedTransactions'
import { useProfileStore } from '../store/useProfileStore'
import { useStatementPeriodStore } from '../store/useStatementPeriodStore'
import './DashboardPage.css'

export const PlanningPage = () => {
  const selectedAccount = useProfileStore((state) => state.profile)
  const selectedPeriod = useStatementPeriodStore((state) => state.selectedPeriod)

  const filters = useMemo(() => {
    return selectedPeriod ? { statementPeriod: selectedPeriod } : undefined
  }, [selectedPeriod])

  const {
    data: projectedTransactions,
    isPending: projectedTransactionsLoading,
    isError: projectedTransactionsError,
  } = useProjectedTransactions(selectedAccount, filters)

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
        <div className="tt-card" style={{ minHeight: 'auto' }}>
          <div className="tt-subcard">
            <PlanningSummaryTable statementPeriod={selectedPeriod} />
          </div>
          <div className="tt-subcard">
            <div className="tt-section-title">Projected Transactions</div>
            {!selectedPeriod && (
              <p className="tt-empty">Select a statement period to manage projected transactions.</p>
            )}
            {selectedPeriod && projectedTransactionsLoading && (
              <p className="tt-empty">Loading projected transactions...</p>
            )}
            {selectedPeriod && projectedTransactionsError && (
              <p className="tt-error">Failed to load projected transactions.</p>
            )}
            {selectedPeriod && !projectedTransactionsLoading && !projectedTransactionsError && (
              <ProjectedTransactionList transactions={sortedProjectedTransactions} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
