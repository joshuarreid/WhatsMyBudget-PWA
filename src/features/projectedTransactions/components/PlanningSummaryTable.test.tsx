import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PlanningSummaryTable } from './PlanningSummaryTable'

vi.mock('../hooks/usePlanningTopSummaries', () => ({
  usePlanningTopSummaries: () => ({
    model: {
      accounts: ['josh', 'anna', 'joint'],
      rows: [
        {
          metric: 'planned',
          label: 'Planned',
          byAccount: {
            josh: { actual: 100, projected: 50, total: 150 },
            anna: { actual: 200, projected: 60, total: 260 },
            joint: { actual: 300, projected: 70, total: 370 },
          },
        },
      ],
    },
    isPending: false,
    isError: false,
    error: null,
  }),
}))

describe('PlanningSummaryTable', () => {
  it('renders account rows expanded by default with tri-ring summaries', () => {
    const html = renderToStaticMarkup(<PlanningSummaryTable statementPeriod="APRIL2026" />)

    expect(html).toContain('Planning Summary')
    expect(html).toContain('<table')
    expect(html).toContain('Joint')
    expect(html).toContain('Josh')
    expect(html).toContain('Anna')
    expect(html.match(/aria-expanded="true"/g)?.length).toBe(3)
    expect(html.match(/tt-crit-tri-ring/g)?.length).toBe(3)
    expect(html).not.toContain('Visual')
  })
})
