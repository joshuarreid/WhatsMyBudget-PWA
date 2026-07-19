import { MainLayout } from '../layouts/MainLayout'
import {
  PlanningNestedCategoryTable,
} from '@/features/projectedTransactions'
import { useStatementPeriodStore } from '../store/useStatementPeriodStore'
import './DashboardPage.css'

export const PlanningPage = () => {
  const selectedPeriod = useStatementPeriodStore((state) => state.selectedPeriod)

  return (
    <MainLayout>
      <div className="dashboard-page-root">
        <div className="tt-card" style={{ minHeight: 'auto' }}>
          <div className="tt-subcard">
            <PlanningNestedCategoryTable statementPeriod={selectedPeriod} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
