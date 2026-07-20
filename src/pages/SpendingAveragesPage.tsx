import { MainLayout } from '../layouts/MainLayout'
import { ProjectedSpendingBarChart } from '@/features/transactions'
import { MonthlySpendingTrendGraph } from '@/features/analytics'

export function SpendingAveragesPage() {
  return (
    <MainLayout hideStatementPeriodChooser>
      <div style={{ padding: 16, display: 'grid', gap: 16 }}>
        <ProjectedSpendingBarChart />
        <MonthlySpendingTrendGraph />
      </div>
    </MainLayout>
  )
}
