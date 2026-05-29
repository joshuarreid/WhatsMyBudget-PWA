import { useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import {
  useCreateProjectedTransaction,
  useUpdateProjectedTransaction,
  useDeleteProjectedTransaction,
} from '../hooks/useProjectedTransactions'
import type { ProjectedTransaction } from '../api/projectedTransactions.types.ts'
import { useStatementPeriodStore } from '@/store/useStatementPeriodStore'
import { useProfileStore } from '@/store/useProfileStore'
import { config } from '@/config/env'
import { statementPeriodToLastDayInputDate, toInputDate } from '@/utils/statementPeriod'

interface ProjectedTransactionListProps {
  transactions?: ProjectedTransaction[]
}

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const formatDate = (value: string | undefined) => {
  if (!value) return ''
  const dt = new Date(value)
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : value
}

const normalizeCurrencyInput = (raw: string) => {
  // Keep digits, optional leading -, and a single dot. Strip currency symbols/spaces.
  let s = raw.replace(/[^0-9.\-]/g, '')

  // Allow '-' only at the beginning
  s = s.replace(/(?!^)-/g, '')

  // Only one decimal point
  const firstDot = s.indexOf('.')
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
  }

  // Limit to 2 decimal digits (while typing)
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

  // Keep it simple: no thousands separators (less cursor jumping on mobile), 2 decimals.
  return num.toFixed(2)
}

const parseCurrencyAmount = (value: string) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : NaN
}

type FormState = {
  id?: number
  name: string
  description: string
  amount: string
  category: string
  projectedDate: string
  statementPeriod: string
  account: string
  criticality: string
  paymentMethod: string
  createdTime?: string
  status?: string
}

const toFormState = (tx?: ProjectedTransaction): FormState => {
  return {
    id: tx?.id,
    name: tx?.name ?? '',
    description: tx?.description ?? '',
    amount: tx?.amount != null ? String(tx.amount) : '',
    category: tx?.category ?? '',
    projectedDate: toInputDate(tx?.projectedDate ?? tx?.projectedTransactionDate),
    statementPeriod: tx?.statementPeriod ?? '',
    account: tx?.account ?? '',
    criticality: tx?.criticality ?? '',
    paymentMethod: tx?.paymentMethod ?? '',
    createdTime: tx?.createdTime,
    status: tx?.status,
  }
}

const toApiPayload = (form: FormState): ProjectedTransaction => {
  return {
    id: form.id,
    name: form.name.trim() || undefined,
    description: form.description.trim() || undefined,
    amount: Number(form.amount),
    category: form.category.trim(),
    projectedDate: form.projectedDate,
    transactionDate: form.projectedDate,
    statementPeriod: form.statementPeriod.trim(),
    account: form.account.trim(),
    criticality: form.criticality.trim(),
    paymentMethod: form.paymentMethod.trim(),
    createdTime: form.createdTime,
    status: form.status,
  }
}

export const ProjectedTransactionList = ({ transactions }: ProjectedTransactionListProps) => {
  const safeTransactions = transactions ?? []

  const availablePeriods = useStatementPeriodStore((s) => s.availablePeriods)
  const globalSelectedPeriod = useStatementPeriodStore((s) => s.selectedPeriod)
  const selectedProfile = useProfileStore((s) => s.profile)

  const categories = config.categories
  const paymentMethods = config.paymentMethods
  const defaultCriticalityMap = config.defaultCriticalityMap
  const defaultPaymentMethodMap = config.defaultPaymentMethodMap

  const createMutation = useCreateProjectedTransaction()
  const updateMutation = useUpdateProjectedTransaction()
  const deleteMutation = useDeleteProjectedTransaction()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selected, setSelected] = useState<ProjectedTransaction | undefined>(undefined)
  const [form, setForm] = useState<FormState>(() => toFormState())
  const [formError, setFormError] = useState<string | null>(null)

  const modalTitle = mode === 'create' ? 'Add projected transaction' : 'Edit projected transaction'

  const busy =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const canSubmit = useMemo(() => {
    if (busy) return false
    if (!form.account.trim()) return false
    if (!form.statementPeriod.trim()) return false
    if (!form.projectedDate) return false
    if (!form.category.trim()) return false
    if (!Number.isFinite(parseCurrencyAmount(form.amount))) return false
    return true
  }, [busy, form])

  const openCreate = () => {
    const statementPeriod = globalSelectedPeriod || availablePeriods[availablePeriods.length - 1] || ''
    const projectedDate = statementPeriod ? statementPeriodToLastDayInputDate(statementPeriod) : ''

    const defaultPayment = defaultPaymentMethodMap[selectedProfile] || ''

    setMode('create')
    setSelected(undefined)
    setForm({
      ...toFormState(),
      account: selectedProfile,
      statementPeriod,
      projectedDate,
      paymentMethod: defaultPayment,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEdit = (tx: ProjectedTransaction) => {
    const next = toFormState(tx)

    // If the record is missing projectedDate, default it based on its statement period.
    if (!next.projectedDate && next.statementPeriod) {
      next.projectedDate = statementPeriodToLastDayInputDate(next.statementPeriod)
    }

    // If payment method is empty, default from profile (best effort).
    if (!next.paymentMethod) {
      next.paymentMethod = defaultPaymentMethodMap[selectedProfile] || ''
    }

    setMode('edit')
    setSelected(tx)
    setForm(next)
    setFormError(null)
    setIsModalOpen(true)
  }



  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value
    const mapped = defaultCriticalityMap[category]
    setForm((s) => ({
      ...s,
      category,
      criticality: mapped || s.criticality,
    }))
  }

  const closeModal = () => {
    if (busy) return
    setIsModalOpen(false)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Normalize right before submit so API always gets a clean number string.
    setForm((s) => ({ ...s, amount: formatCurrencyForInput(normalizeCurrencyInput(s.amount)) }))

    if (!canSubmit) {
      setFormError('Please fill out all required fields.')
      return
    }

    const payload = toApiPayload({
      ...form,
      amount: formatCurrencyForInput(normalizeCurrencyInput(form.amount)),
    })

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload)
      } else {
        const id = String(selected?.id ?? payload.id ?? '')
        if (!id) {
          setFormError('Missing transaction id.')
          return
        }
        await updateMutation.mutateAsync({ id, data: payload })
      }
      setIsModalOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Request failed.')
    }
  }

  const onDelete = async (tx: ProjectedTransaction) => {
    const id = tx.id
    if (id == null) return

    const ok = window.confirm('Delete this projected transaction?')
    if (!ok) return

    try {
      await deleteMutation.mutateAsync(String(id))
    } catch {
      // mutation error already tracked by react-query; keep UI simple
    }
  }

  return (
    <div className="tt-crit-txns-list">
      <div className="tt-proj-toolbar">
        <button type="button" className="tt-proj-add" onClick={openCreate}>
          + Add
        </button>
      </div>

      {safeTransactions.length === 0 ? null :
        safeTransactions.map((transaction: ProjectedTransaction, idx: number) => {
          const title = transaction.description || transaction.name || 'Projected Transaction'
          const category = String(transaction.category ?? '').trim()
          const amountClass = transaction.amount < 0 ? 'tt-row-amount-neg' : 'tt-row-amount-pos'
          const key = transaction.id ?? `projected-${idx}`
          const dateValue = transaction.projectedDate ?? transaction.projectedTransactionDate

          return (
            <div key={key} className="tt-row tt-row-projected tt-crit-txn-row">
              <div className="tt-row-top">
                <div className="tt-crit-title-stack">
                  <strong className="tt-row-title tt-crit-title-ellipsis">{title}</strong>
                  {category && <div className="tt-crit-subline tt-crit-title-ellipsis">{category}</div>}
                </div>

                <div className="tt-crit-right-stack">
                  <strong className={amountClass}>{formatCurrency(Math.abs(transaction.amount))}</strong>
                  <div className="tt-crit-subline tt-crit-right-sub">{formatDate(dateValue)}</div>
                </div>
              </div>

              <div className="tt-proj-row-actions">
                <button type="button" className="tt-proj-action" onClick={() => openEdit(transaction)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="tt-proj-action tt-proj-action-danger"
                  onClick={() => onDelete(transaction)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}

      <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
        <form className="tt-proj-form" onSubmit={onSubmit}>
          {formError && <div className="tt-error">{formError}</div>}

          <div className="tt-proj-form-grid">
            {/* Account field is hidden but value is still managed in state and sent in payload */}
            {/* <label className="tt-proj-field">
              <span className="tt-proj-label">Account *</span>
              <input
                className="tt-proj-input"
                value={form.account}
                onChange={(e) => setForm((s) => ({ ...s, account: e.target.value }))}
                placeholder="personal / joint"
                required
              />
            </label> */}

            {/* Statement period is shown as read-only, not editable */}
            <label className="tt-proj-field">
              <span className="tt-proj-label">Statement period</span>
              <input
                className="tt-proj-input"
                value={form.statementPeriod}
                disabled
                readOnly
              />
            </label>

            {/* Name field moved to top, right after statement period */}
            <label className="tt-proj-field">
              <span className="tt-proj-label">Name</span>
              <input
                className="tt-proj-input"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Optional"
              />
            </label>

            {/* Description field is hidden but value is still managed in state and sent in payload */}
            {/* <label className="tt-proj-field">
              <span className="tt-proj-label">Description</span>
              <input
                className="tt-proj-input"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Optional"
              />
            </label> */}

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
                  onChange={(e) => {
                    const next = normalizeCurrencyInput(e.target.value)
                    setForm((s) => ({ ...s, amount: next }))
                  }}
                  onBlur={() => {
                    setForm((s) => ({ ...s, amount: formatCurrencyForInput(s.amount) }))
                  }}
                  placeholder="0.00"
                  required
                />
              </div>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Category *</span>
              <select
                className="tt-proj-input"
                value={form.category}
                onChange={handleCategoryChange}
                required
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Criticality</span>
              <select
                className="tt-proj-input"
                value={form.criticality}
                onChange={(e) => setForm((s) => ({ ...s, criticality: e.target.value }))}
              >
                <option value="">—</option>
                <option value="Essential">Essential</option>
                <option value="Nonessential">Nonessential</option>
              </select>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Payment method</span>
              <select
                className="tt-proj-input"
                value={form.paymentMethod}
                onChange={(e) => setForm((s) => ({ ...s, paymentMethod: e.target.value }))}
              >
                <option value="">—</option>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
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
              {mode === 'create' ? (createMutation.isPending ? 'Creating…' : 'Create') : updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
