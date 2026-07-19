import type { CriticalitySummary } from '@/features/transactions/api/criticalitySummary.types'
import { TriRingStat } from './TriRingStat'

export const HorizontalTriRingStat = (props: {
  planned: CriticalitySummary
  essential: CriticalitySummary
  nonessential: CriticalitySummary
}) => {
  return (
    <div className="tt-horizontal-tri-ring">
      <TriRingStat
        planned={props.planned}
        essential={props.essential}
        nonessential={props.nonessential}
      />
    </div>
  )
}

