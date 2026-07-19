import { useMemo, useState } from 'react'
import {
  usePlanningTopSummaries,
  type PlanningAccount,
  type PlanningTopSummaryModel,
} from '../hooks/usePlanningTopSummaries'
import { TriRingStat } from '@/features/transactions/components/TriRingStat'

const ACCOUNT_LABELS: Record<PlanningAccount, string> = {
  joint: 'Joint',
  josh: 'Josh',
  anna: 'Anna',
}

const ACCOUNT_ORDER = ['josh', 'anna'] as const
type SummaryAccount = (typeof ACCOUNT_ORDER)[number]
type ExpandedState = Record<SummaryAccount, boolean>

const getDefaultExpandedState = (): ExpandedState => ({
  josh: true,
  anna: true,
})

const toCriticalitySummary = (model: PlanningTopSummaryModel, account: PlanningAccount, metric: 'planned' | 'essential' | 'nonessential') => {
  const row = model.rows.find((r) => r.metric === metric)
  const cell = row?.byAccount[account]
  return {
    actualCount: 0,
    projectedCount: 0,
    actualTotal: cell?.actual ?? 0,
    projectedTotal: cell?.projected ?? 0,
  }
}

const TableView = ({ model }: { model: PlanningTopSummaryModel }) => {
  const initialExpanded = useMemo(() => getDefaultExpandedState(), [])
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded)

  const toggleRow = (account: SummaryAccount) => {
    setExpanded((current) => ({
      ...current,
      [account]: !current[account],
    }))
  }

  return (
    <div className="tt-plan-table-wrap">
      <table className="tt-plan-table">
        <tbody>
          {ACCOUNT_ORDER.map((account) => (
            <tr key={account}>
              <td>
                <div className="tt-plan-account-row">
                  <button
                    type="button"
                    className="tt-plan-account-toggle"
                    aria-expanded={expanded[account]}
                    onClick={() => toggleRow(account)}
                  >
                    {ACCOUNT_LABELS[account]}
                  </button>
                  {expanded[account] ? (
                    <TriRingStat
                      planned={toCriticalitySummary(model, account, 'planned')}
                      essential={toCriticalitySummary(model, account, 'essential')}
                      nonessential={toCriticalitySummary(model, account, 'nonessential')}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const PlanningSummaryTable = ({ statementPeriod }: { statementPeriod?: string }) => {
  const { model, isPending, isError } = usePlanningTopSummaries(statementPeriod)

  return (
    <section className="tt-plan-summary" aria-label="Planning summary by account">
      <div className="tt-section-title">Planning Summary</div>
      {!statementPeriod ? (
        <p className="tt-empty">Select a statement period to view account summaries.</p>
      ) : isPending ? (
        <p className="tt-empty">Loading planning summary...</p>
      ) : isError ? (
        <p className="tt-error">Failed to load planning summary.</p>
      ) : (
        <TableView model={model} />
      )}
    </section>
  )
}
