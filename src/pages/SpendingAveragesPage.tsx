import { MainLayout } from '../layouts/MainLayout'
import { ProjectedSpendingBarChart } from '@/features/transactions'

export function SpendingAveragesPage() {
  return (
    <MainLayout>
      <div style={{ padding: 16 }}>
        <ProjectedSpendingBarChart />
      </div>
    </MainLayout>
  )
}
