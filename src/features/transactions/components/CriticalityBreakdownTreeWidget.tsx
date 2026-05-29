import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Modal } from '@/components/Modal'
import { config } from '@/config/env'
import { useCreateProjectedTransaction } from '@/features/projectedTransactions'
import type { ProjectedTransaction } from '@/features/projectedTransactions/api/projectedTransactions.types.ts'
import { statementPeriodToLastDayInputDate } from '@/utils/statementPeriod'

type CategoryBreakdownRow = {
  category: string
  actualTotal: number
  projectedTotal: number
}

type FormState = {
  account: string
  statementPeriod: string
  name: string
  description: string
  amount: string
  category: string
  criticality: string
  paymentMethod: string
  projectedDate: string
}

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const normalizeCategory = (value: unknown) => String(value ?? 'Uncategorized').trim() || 'Uncategorized'

const normalizeCurrencyInput = (raw: string) => {
  let s = raw.replace(/[^0-9.\-]/g, '')
  s = s.replace(/(?!^)-/g, '')

  const firstDot = s.indexOf('.')
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
  }

  const parts = s.split('.')
  if (parts.length === 2) {
    parts[1] = parts[1].slice(0, 2)
    s = `${parts[0]}.${parts[1]}`
  }

  return s
}

const formatCurrencyForInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const num = Number(trimmed)
  if (!Number.isFinite(num)) return trimmed

  return num.toFixed(2)
}

const parseCurrencyAmount = (value: string) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : NaN
}

const toApiPayload = (form: FormState): ProjectedTransaction => ({
  account: form.account.trim(),
  statementPeriod: form.statementPeriod.trim(),
  name: form.name.trim() || undefined,
  description: form.description.trim() || undefined,
  amount: Number(form.amount),
  category: form.category.trim(),
  criticality: form.criticality.trim(),
  paymentMethod: form.paymentMethod.trim(),
  projectedDate: form.projectedDate,
})

const buildDefaultForm = (account: string, statementPeriod: string): FormState => ({
  account,
  statementPeriod,
  name: '',
  description: '',
  amount: '',
  category: '',
  criticality: '',
  paymentMethod: config.defaultPaymentMethodMap[account] || '',
  projectedDate: statementPeriodToLastDayInputDate(statementPeriod),
})

const sortProjectedTransactions = (transactions: ProjectedTransaction[]) => {
  return [...transactions].sort((a, b) => {
    const aDate = a.projectedDate ?? a.projectedTransactionDate
    const bDate = b.projectedDate ?? b.projectedTransactionDate
    return new Date(bDate ?? 0).getTime() - new Date(aDate ?? 0).getTime()
  })
}

const SectionTreeTable = (props: {
  title: string
  rows: CategoryBreakdownRow[]
  projectedByCategory: Map<string, ProjectedTransaction[]>
}) => {
  const totalActual = props.rows.reduce((sum, row) => sum + row.actualTotal, 0)
  const totalProjected = props.rows.reduce((sum, row) => sum + row.projectedTotal, 0)

  return (
    <section className="tt-crit-sectioned-block" aria-label={`${props.title} criticality section`}>
      <div className="tt-crit-sectioned-title">{props.title}</div>
      {props.rows.length === 0 ? (
        <div className="tt-empty">No transactions in this section.</div>
      ) : (
        <div className="tt-crit-sectioned-table-wrap">
          <table className="tt-crit-sectioned-table">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row) => {
                const projectedRows = props.projectedByCategory.get(normalizeCategory(row.category)) ?? []
                const hasProjected = Math.abs(row.projectedTotal) > 0

                return (
                  <CategoryTreeRows
                    key={row.category}
                    category={row.category}
                    actualTotal={row.actualTotal}
                    projectedTotal={row.projectedTotal}
                    hasProjected={hasProjected}
                    projectedRows={projectedRows}
                  />
                )
              })}
            </tbody>
            <tfoot>
              <tr className="tt-crit-table-total-row">
                <td className="tt-crit-cat"><strong>Total</strong></td>
                <td style={{ textAlign: 'right' }}>
                  <span className="tt-crit-actual-amt">{formatCurrency(totalActual)}</span>
                  {Math.abs(totalProjected) > 0 && (
                    <span className="tt-crit-projected-amt"> + {formatCurrency(totalProjected)}</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  )
}

const CategoryTreeRows = (props: {
  category: string
  actualTotal: number
  projectedTotal: number
  hasProjected: boolean
  projectedRows: ProjectedTransaction[]
}) => {
  const totalAmount = props.actualTotal + props.projectedTotal

  return (
    <>
      <tr className={props.hasProjected ? 'tt-crit-row-projected' : undefined}>
        <td className="tt-crit-cat">{props.category}</td>
        <td style={{ textAlign: 'right' }}>
          <span className="tt-crit-actual-amt">{formatCurrency(totalAmount)}</span>
        </td>
      </tr>
      {props.projectedRows.map((transaction, index) => {
        const title = transaction.description || transaction.name || 'Projected transaction'
        const key = transaction.id ?? `${props.category}-projected-${index}`
        const isLast = index === props.projectedRows.length - 1

        return (
          <tr key={key} className="tt-crit-sectioned-projected-row">
            <td className="tt-crit-sectioned-projected-cell">
              <div className="tt-crit-sectioned-projected-content">
                <span
                  aria-hidden
                  className={`tt-crit-tree-branch ${isLast ? 'tt-crit-tree-branch-last' : ''}`}
                />
                <strong className="tt-row-title tt-crit-title-ellipsis">{title}</strong>
              </div>
            </td>
            <td style={{ textAlign: 'right' }}>
              <span className="tt-crit-projected-amt">+ {formatCurrency(transaction.amount)}</span>
            </td>
          </tr>
        )
      })}
    </>
  )
}

export const CriticalityBreakdownTreeWidget = (props: {
  account: string
  statementPeriod: string
  essentialByCategory: CategoryBreakdownRow[]
  nonessentialByCategory: CategoryBreakdownRow[]
  essentialProjected: ProjectedTransaction[]
  nonessentialProjected: ProjectedTransaction[]
}) => {
  const createMutation = useCreateProjectedTransaction()
  const [tab, setTab] = useState<'essential' | 'nonessential'>('nonessential')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(() => buildDefaultForm(props.account, props.statementPeriod))

  const categories = config.categories
  const paymentMethods = config.paymentMethods
  const defaultCriticalityMap = config.defaultCriticalityMap
  const busy = createMutation.isPending

  const canSubmit = useMemo(() => {
    if (busy) return false
    if (!form.account.trim()) return false
    if (!form.statementPeriod.trim()) return false
    if (!form.projectedDate) return false
    if (!form.category.trim()) return false
    if (!form.criticality.trim()) return false
    return Number.isFinite(parseCurrencyAmount(form.amount))
  }, [busy, form])

  const essentialProjectedByCategory = useMemo(() => {
    const map = new Map<string, ProjectedTransaction[]>()
    for (const transaction of sortProjectedTransactions(props.essentialProjected)) {
      const category = normalizeCategory(transaction.category)
      map.set(category, [...(map.get(category) ?? []), transaction])
    }
    return map
  }, [props.essentialProjected])

  const nonessentialProjectedByCategory = useMemo(() => {
    const map = new Map<string, ProjectedTransaction[]>()
    for (const transaction of sortProjectedTransactions(props.nonessentialProjected)) {
      const category = normalizeCategory(transaction.category)
      map.set(category, [...(map.get(category) ?? []), transaction])
    }
    return map
  }, [props.nonessentialProjected])

  const openCreate = () => {
    setForm({
      ...buildDefaultForm(props.account, props.statementPeriod),
      criticality: tab === 'essential' ? 'Essential' : 'Nonessential',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (busy) return
    setIsModalOpen(false)
  }

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value
    const mappedCriticality = defaultCriticalityMap[category]

    setForm((current) => ({
      ...current,
      category,
      criticality: mappedCriticality || current.criticality,
    }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const normalizedAmount = formatCurrencyForInput(normalizeCurrencyInput(form.amount))
    setForm((current) => ({ ...current, amount: normalizedAmount }))

    if (!canSubmit) {
      setFormError('Please fill out all required fields.')
      return
    }

    try {
      await createMutation.mutateAsync(
        toApiPayload({
          ...form,
          amount: normalizedAmount,
        })
      )
      setIsModalOpen(false)
      setForm(buildDefaultForm(props.account, props.statementPeriod))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Request failed.')
    }
  }

  const activeSection = tab === 'essential'
    ? {
        title: 'Essential',
        rows: props.essentialByCategory,
        projectedByCategory: essentialProjectedByCategory,
      }
    : {
        title: 'Nonessential',
        rows: props.nonessentialByCategory,
        projectedByCategory: nonessentialProjectedByCategory,
      }

  return (
    <div className="tt-crit-widget tt-crit-summary-sectioned">
      <div className="tt-crit-summary-sectioned-header">
        <div className="tt-crit-modal-tabs tt-crit-summary-tabs" role="tablist" aria-label="Criticality summary tabs">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'essential'}
            className={`tt-pill tt-crit-tab ${tab === 'essential' ? 'tt-crit-tab-active' : ''}`}
            onClick={() => setTab('essential')}
          >
            Essential
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'nonessential'}
            className={`tt-pill tt-crit-tab ${tab === 'nonessential' ? 'tt-crit-tab-active' : ''}`}
            onClick={() => setTab('nonessential')}
          >
            Nonessential
          </button>
        </div>
        <button type="button" className="tt-proj-add" onClick={openCreate} disabled={!props.account || !props.statementPeriod}>
          + Add Projected
        </button>
      </div>

      <div className="tt-crit-summary-sectioned-body">
        <SectionTreeTable
          title={activeSection.title}
          rows={activeSection.rows}
          projectedByCategory={activeSection.projectedByCategory}
        />
      </div>

      <Modal isOpen={isModalOpen} title="Add projected transaction" onClose={closeModal}>
        <form className="tt-proj-form" onSubmit={onSubmit}>
          {formError && <div className="tt-error">{formError}</div>}

          <div className="tt-proj-form-grid">
            <label className="tt-proj-field">
              <span className="tt-proj-label">Statement period</span>
              <input className="tt-proj-input" value={form.statementPeriod} disabled readOnly />
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Name</span>
              <input
                className="tt-proj-input"
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="Optional"
              />
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Amount *</span>
              <div className="tt-proj-money">
                <span className="tt-proj-money-prefix">$</span>
                <input
                  className="tt-proj-input tt-proj-money-input"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={form.amount}
                  onChange={(e) => setForm((current) => ({ ...current, amount: normalizeCurrencyInput(e.target.value) }))}
                  onBlur={() => setForm((current) => ({ ...current, amount: formatCurrencyForInput(current.amount) }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Category *</span>
              <select className="tt-proj-input" value={form.category} onChange={handleCategoryChange} required>
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Criticality *</span>
              <select
                className="tt-proj-input"
                value={form.criticality}
                onChange={(e) => setForm((current) => ({ ...current, criticality: e.target.value }))}
                required
              >
                <option value="" disabled>
                  Select criticality…
                </option>
                <option value="Essential">Essential</option>
                <option value="Nonessential">Nonessential</option>
              </select>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Payment method</span>
              <select
                className="tt-proj-input"
                value={form.paymentMethod}
                onChange={(e) => setForm((current) => ({ ...current, paymentMethod: e.target.value }))}
              >
                <option value="">—</option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {paymentMethod}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="tt-proj-form-actions">
            <button type="button" className="tt-proj-secondary" onClick={closeModal} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="tt-proj-primary" disabled={!canSubmit}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


