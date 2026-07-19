import { describe, expect, it } from 'vitest'
import { buildPlanningTopSummaryModel } from './planningTopSummaryModel'

describe('buildPlanningTopSummaryModel', () => {
  it('maps account summaries to planned/essential/nonessential rows', () => {
    const model = buildPlanningTopSummaryModel({
      josh: {
        planned: { actualCount: 0, projectedCount: 1, actualTotal: 10, projectedTotal: 5 },
        essential: { actualCount: 0, projectedCount: 1, actualTotal: 20, projectedTotal: 6 },
        nonessential: { actualCount: 0, projectedCount: 1, actualTotal: 30, projectedTotal: 7 },
      },
      anna: {
        planned: { actualCount: 0, projectedCount: 1, actualTotal: 40, projectedTotal: 8 },
        essential: { actualCount: 0, projectedCount: 1, actualTotal: 50, projectedTotal: 9 },
        nonessential: { actualCount: 0, projectedCount: 1, actualTotal: 60, projectedTotal: 10 },
      },
      joint: {
        planned: { actualCount: 0, projectedCount: 1, actualTotal: 70, projectedTotal: 11 },
        essential: { actualCount: 0, projectedCount: 1, actualTotal: 80, projectedTotal: 12 },
        nonessential: { actualCount: 0, projectedCount: 1, actualTotal: 90, projectedTotal: 13 },
      },
    })

    expect(model.accounts).toEqual(['josh', 'anna', 'joint'])
    expect(model.rows.map((row) => row.metric)).toEqual(['planned', 'essential', 'nonessential'])
    expect(model.rows[0].byAccount.josh).toEqual({ actual: 10, projected: 5, total: 15 })
    expect(model.rows[1].byAccount.anna).toEqual({ actual: 50, projected: 9, total: 59 })
    expect(model.rows[2].byAccount.joint).toEqual({ actual: 90, projected: 13, total: 103 })
  })

  it('defaults missing account summaries to zeros', () => {
    const model = buildPlanningTopSummaryModel({})

    expect(model.rows[0].byAccount.josh).toEqual({ actual: 0, projected: 0, total: 0 })
    expect(model.rows[1].byAccount.anna).toEqual({ actual: 0, projected: 0, total: 0 })
    expect(model.rows[2].byAccount.joint).toEqual({ actual: 0, projected: 0, total: 0 })
  })
})
