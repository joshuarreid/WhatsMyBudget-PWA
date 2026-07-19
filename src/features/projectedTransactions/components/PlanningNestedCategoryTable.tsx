import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { config } from '@/config/env'
import { Modal } from '@/components/Modal'
import { useStatementPeriodStore } from '@/store/useStatementPeriodStore'
import { addMonthsToStatementPeriod, parseStatementPeriod } from '@/utils/statementPeriodWindow'
import { statementPeriodToLastDayInputDate, toInputDate } from '@/utils/statementPeriod'
import { HorizontalTriRingStat } from '@/features/transactions/components/HorizontalTriRingStat'
import {
  useCreateProjectedTransaction,
  useDeleteProjectedTransaction,
  useProjectedTransactions,
  useUpdateProjectedTransaction,
} from '../hooks/useProjectedTransactions'
import { usePlanningTopSummaries } from '../hooks/usePlanningTopSummaries'
import type { ProjectedTransaction } from '../api/projectedTransactions.types'

type PlanningAccount = 'joint' | 'josh' | 'anna'
type ExpandedState = Record<string, boolean>

type DragState = {
  transaction: ProjectedTransaction
  sourceAccount: PlanningAccount
  sourceTransactionAccount: string
  sourcePeriod: string
  lastPeriodSwitchAt: number
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
  criticality_id?: number
  paymentMethod: string
  createdTime?: string
  status?: string
}

const ACCOUNT_ORDER: PlanningAccount[] = ['joint', 'josh', 'anna']
const ACCOUNT_LABELS: Record<PlanningAccount, string> = {
  joint: 'Joint',
  josh: 'Josh',
  anna: 'Anna',
}

const EDGE_SWITCH_COOLDOWN_MS = 500
const EDGE_SWITCH_HOTZONE_PX = 64

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const normalizeCategory = (value: unknown) => String(value ?? 'Uncategorized').trim() || 'Uncategorized'
const normalizeAccount = (value: unknown) => String(value ?? '').trim().toLowerCase()
const normalizeTextForMatch = (value: unknown) =>
  String(value ?? '')
    .replace(/\[split\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

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

const CRITICALITY_NAMES: Record<number, string> = {
  1: 'Essential',
  2: 'Nonessential',
  3: 'Planned',
}

const CRITICALITY_IDS: Record<string, number> = {
  Essential: 1,
  Nonessential: 2,
  Planned: 3,
}

const toFormState = (tx?: ProjectedTransaction): FormState => ({
  id: tx?.id,
  name: tx?.name ?? '',
  description: tx?.description ?? '',
  amount: tx?.amount != null ? String(tx.amount) : '',
  category: tx?.category ?? '',
  projectedDate: toInputDate(tx?.projectedDate ?? tx?.projectedTransactionDate ?? tx?.transactionDate),
  statementPeriod: tx?.statementPeriod ?? '',
  account: tx?.account ?? '',
  criticality_id: tx?.criticality_id,
  paymentMethod: tx?.paymentMethod ?? '',
  createdTime: tx?.createdTime,
  status: tx?.status,
})

const toApiPayload = (form: FormState): ProjectedTransaction => ({
  id: form.id,
  name: form.name.trim() || undefined,
  description: form.description.trim() || undefined,
  amount: Number(form.amount),
  category: normalizeCategory(form.category),
  projectedDate: form.projectedDate,
  transactionDate: form.projectedDate,
  statementPeriod: form.statementPeriod.trim(),
  account: form.account.trim(),
  criticality_id: form.criticality_id ?? 2,
  paymentMethod: form.paymentMethod.trim(),
  createdTime: form.createdTime,
  status: form.status,
})

const toProjectedDate = (tx: ProjectedTransaction, period: string) =>
  tx.projectedDate ?? tx.projectedTransactionDate ?? tx.transactionDate ?? statementPeriodToLastDayInputDate(period)

const toSortablePeriodNumber = (period: string) => {
  const parsed = parseStatementPeriod(period)
  if (!parsed) return Number.MAX_SAFE_INTEGER
  return parsed.year * 12 + parsed.monthIndex
}

const sortedUniquePeriods = (periods: string[]) =>
  Array.from(new Set(periods))
    .filter(Boolean)
    .sort((a, b) => toSortablePeriodNumber(a) - toSortablePeriodNumber(b))

const buildSectionRows = (transactions: ProjectedTransaction[]) => {
  const grouped = new Map<string, ProjectedTransaction[]>()
  for (const tx of transactions) {
    const category = normalizeCategory(tx.category)
    const current = grouped.get(category) ?? []
    current.push(tx)
    grouped.set(category, current)
  }

  return Array.from(grouped.entries())
    .map(([category, children]) => ({
      category,
      total: children.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
      children: [...children].sort((a, b) => {
        const aDate = new Date(toProjectedDate(a, a.statementPeriod)).getTime()
        const bDate = new Date(toProjectedDate(b, b.statementPeriod)).getTime()
        return bDate - aDate
      }),
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      return a.category.localeCompare(b.category)
    })
}

const toCriticalitySummary = (
  model: ReturnType<typeof usePlanningTopSummaries>['model'],
  account: PlanningAccount,
  metric: 'planned' | 'essential' | 'nonessential'
) => {
  const row = model.rows.find((r) => r.metric === metric)
  const cell = row?.byAccount[account]
  return {
    actualCount: 0,
    projectedCount: 0,
    actualTotal: cell?.actual ?? 0,
    projectedTotal: cell?.projected ?? 0,
  }
}

export const PlanningNestedCategoryTable = ({ statementPeriod }: { statementPeriod?: string }) => {
  const setSelectedPeriod = useStatementPeriodStore((s) => s.setSelectedPeriod)
  const setAvailablePeriods = useStatementPeriodStore((s) => s.setAvailablePeriods)

  const jointQuery = useProjectedTransactions('joint', statementPeriod ? { statementPeriod } : undefined)
  const joshQuery = useProjectedTransactions('josh', statementPeriod ? { statementPeriod } : undefined)
  const annaQuery = useProjectedTransactions('anna', statementPeriod ? { statementPeriod } : undefined)

  const createMutation = useCreateProjectedTransaction()
  const deleteMutation = useDeleteProjectedTransaction()
  const updateMutation = useUpdateProjectedTransaction()
  const planningSummary = usePlanningTopSummaries(statementPeriod)

  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [activeDropAccount, setActiveDropAccount] = useState<PlanningAccount | null>(null)
  const [activeDropCategoryKey, setActiveDropCategoryKey] = useState<string | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [blockedMoveMessage, setBlockedMoveMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState<ProjectedTransaction | undefined>(undefined)
  const [form, setForm] = useState<FormState>(() => toFormState())
  const [formError, setFormError] = useState<string | null>(null)

  const busy = createMutation.isPending || deleteMutation.isPending || updateMutation.isPending
  const categories = config.categories
  const paymentMethods = config.paymentMethods
  const defaultCriticalityMap = config.defaultCriticalityMap

  const byAccount = useMemo(() => {
    return {
      joint: buildSectionRows(jointQuery.data?.projectedTransactions ?? []),
      josh: buildSectionRows(joshQuery.data?.projectedTransactions ?? []),
      anna: buildSectionRows(annaQuery.data?.projectedTransactions ?? []),
    } satisfies Record<PlanningAccount, ReturnType<typeof buildSectionRows>>
  }, [annaQuery.data?.projectedTransactions, jointQuery.data?.projectedTransactions, joshQuery.data?.projectedTransactions])

  const isPending = Boolean(statementPeriod) && (jointQuery.isPending || joshQuery.isPending || annaQuery.isPending)
  const isError = jointQuery.isError || joshQuery.isError || annaQuery.isError

  const toggleCategory = (account: PlanningAccount, category: string) => {
    const key = `${account}:${category}`
    setExpanded((current) => ({ ...current, [key]: !(current[key] ?? true) }))
  }

  const resolveJointSourceForSplit = (tx: ProjectedTransaction, sectionAccount: PlanningAccount): ProjectedTransaction => {
    if (sectionAccount === 'joint') return tx

    const txName = normalizeTextForMatch(tx.name)
    const txDesc = normalizeTextForMatch(tx.description)
    const txCategory = normalizeCategory(tx.category).toLowerCase()
    const txDate = toProjectedDate(tx, tx.statementPeriod)
    const txCriticality = tx.criticality_id ?? 2
    const txAmount = Number(tx.amount) || 0

    const looksSplit =
      String(tx.name ?? '').toLowerCase().includes('[split]') ||
      String(tx.description ?? '').toLowerCase().includes('[split]')

    if (!looksSplit) return tx

    const jointTransactions = jointQuery.data?.projectedTransactions ?? []
    const exactNameAndDescMatch = jointTransactions.find((candidate) => {
      const sameCategory = normalizeCategory(candidate.category).toLowerCase() === txCategory
      const sameCriticality = (candidate.criticality_id ?? 2) === txCriticality
      const sameDate = toProjectedDate(candidate, candidate.statementPeriod) === txDate
      const candidateName = normalizeTextForMatch(candidate.name)
      const candidateDesc = normalizeTextForMatch(candidate.description)
      const sameName = txName.length > 0 && candidateName === txName
      const sameDesc = txDesc.length > 0 && candidateDesc === txDesc
      const amountClose = Math.abs((Number(candidate.amount) || 0) - txAmount * 2) < 0.01
      return sameCategory && sameCriticality && sameDate && amountClose && (sameName || sameDesc)
    })
    if (exactNameAndDescMatch) return exactNameAndDescMatch

    const fallbackByAmountAndMeta = jointTransactions.find((candidate) => {
      const sameCategory = normalizeCategory(candidate.category).toLowerCase() === txCategory
      const sameCriticality = (candidate.criticality_id ?? 2) === txCriticality
      const sameDate = toProjectedDate(candidate, candidate.statementPeriod) === txDate
      const amountClose = Math.abs((Number(candidate.amount) || 0) - txAmount * 2) < 0.01
      return sameCategory && sameCriticality && sameDate && amountClose
    })
    return fallbackByAmountAndMeta ?? tx
  }

  const openEdit = (tx: ProjectedTransaction, sectionAccount: PlanningAccount) => {
    const resolvedTx = resolveJointSourceForSplit(tx, sectionAccount)
    const next = toFormState(resolvedTx)
    if (!next.projectedDate && next.statementPeriod) {
      next.projectedDate = statementPeriodToLastDayInputDate(next.statementPeriod)
    }
    setSelected(resolvedTx)
    setForm(next)
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (busy) return
    setIsModalOpen(false)
  }

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const category = normalizeCategory(event.target.value)
    const mapped = defaultCriticalityMap[category]
    setForm((current) => ({
      ...current,
      category,
      criticality_id: mapped ? CRITICALITY_IDS[mapped] : current.criticality_id,
    }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setForm((current) => ({ ...current, amount: formatCurrencyForInput(normalizeCurrencyInput(current.amount)) }))

    if (!form.account.trim() || !form.statementPeriod.trim() || !form.projectedDate || !form.category.trim() || !Number.isFinite(parseCurrencyAmount(form.amount))) {
      setFormError('Please fill out all required fields.')
      return
    }

    const payload = toApiPayload({
      ...form,
      amount: formatCurrencyForInput(normalizeCurrencyInput(form.amount)),
    })

    try {
      const id = String(selected?.id ?? payload.id ?? '')
      if (!id) {
        setFormError('Missing transaction id.')
        return
      }
      await updateMutation.mutateAsync({ id, data: payload })
      setIsModalOpen(false)
      setSelected(undefined)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Request failed.')
    }
  }

  const ensurePeriodExists = (period: string) => {
    const existing = useStatementPeriodStore.getState().availablePeriods
    if (existing.includes(period)) return
    setAvailablePeriods(sortedUniquePeriods([...existing, period]))
  }

  const maybeSwitchPeriodFromPointer = (clientX: number) => {
    if (!dragState || !statementPeriod) return
    const now = Date.now()
    if (now - dragState.lastPeriodSwitchAt < EDGE_SWITCH_COOLDOWN_MS) return

    const viewportWidth = window.innerWidth
    const nearLeft = clientX <= EDGE_SWITCH_HOTZONE_PX
    const nearRight = clientX >= viewportWidth - EDGE_SWITCH_HOTZONE_PX
    if (!nearLeft && !nearRight) return

    const delta = nearLeft ? -1 : 1
    const targetPeriod = addMonthsToStatementPeriod(statementPeriod, delta)
    if (!targetPeriod) return

    ensurePeriodExists(targetPeriod)
    setSelectedPeriod(targetPeriod)
    setDragState((current) => (current ? { ...current, lastPeriodSwitchAt: now } : current))
  }

  const canCrossAccountTransfer = (targetAccount: PlanningAccount) => {
    if (!dragState) return false
    return (
      dragState.sourceAccount === 'joint' &&
      dragState.sourceTransactionAccount === 'joint' &&
      (targetAccount === 'josh' || targetAccount === 'anna')
    )
  }

  const handleDropOnAccount = async (targetAccount: PlanningAccount, targetCategory?: string) => {
    if (!dragState || !statementPeriod || busy) return
    const targetPeriod = statementPeriod
    const sourceId = dragState.transaction.id
    if (sourceId == null) {
      setMoveError('Unable to move a transaction without an id.')
      return
    }

    const normalizedTargetCategory = targetCategory ? normalizeCategory(targetCategory) : undefined
    const normalizedSourceCategory = normalizeCategory(dragState.transaction.category)

    if (targetAccount === dragState.sourceAccount && targetPeriod === dragState.sourcePeriod) {
      if (normalizedTargetCategory && normalizedTargetCategory !== normalizedSourceCategory) {
        try {
          await updateMutation.mutateAsync({
            id: String(sourceId),
            data: {
              ...dragState.transaction,
              category: normalizedTargetCategory,
              projectedDate: toProjectedDate(dragState.transaction, targetPeriod),
              transactionDate: toProjectedDate(dragState.transaction, targetPeriod),
              statementPeriod: targetPeriod,
            },
          })
        } catch (error) {
          setMoveError(error instanceof Error ? error.message : 'Failed to change category.')
        } finally {
          setActiveDropCategoryKey(null)
          setActiveDropAccount(null)
          setDragState(null)
        }
        return
      }
      setActiveDropCategoryKey(null)
      setActiveDropAccount(null)
      setDragState(null)
      return
    }

    if (targetAccount !== dragState.sourceAccount && !canCrossAccountTransfer(targetAccount)) {
      setBlockedMoveMessage('Only Joint rows can be moved to Josh or Anna. Split rows in Josh/Anna cannot move across owners.')
      setActiveDropCategoryKey(null)
      setActiveDropAccount(null)
      setDragState(null)
      return
    }

    const mappedPaymentMethod = config.defaultPaymentMethodMap[targetAccount] ?? ''
    const payload: ProjectedTransaction = {
      name: dragState.transaction.name,
      description: dragState.transaction.description,
      amount: Number(dragState.transaction.amount) || 0,
      category: normalizedTargetCategory ?? normalizedSourceCategory,
      criticality_id: dragState.transaction.criticality_id ?? 2,
      paymentMethod:
        targetAccount === dragState.sourceAccount
          ? dragState.transaction.paymentMethod ?? mappedPaymentMethod
          : mappedPaymentMethod,
      account: targetAccount,
      statementPeriod: targetPeriod,
      projectedDate: toProjectedDate(dragState.transaction, targetPeriod),
      transactionDate: toProjectedDate(dragState.transaction, targetPeriod),
      status: dragState.transaction.status,
    }

    setMoveError(null)
    try {
      await deleteMutation.mutateAsync(String(sourceId))
      await createMutation.mutateAsync(payload)
    } catch (error) {
      setMoveError(error instanceof Error ? error.message : 'Failed to move projected transaction.')
    } finally {
      setActiveDropCategoryKey(null)
      setActiveDropAccount(null)
      setDragState(null)
    }
  }

  if (!statementPeriod) {
    return <p className="tt-empty">Select a statement period to manage projected transactions.</p>
  }

  if (isPending && !dragState) {
    return <p className="tt-empty">Loading projected transactions...</p>
  }

  if (isError) {
    return <p className="tt-error">Failed to load projected transactions.</p>
  }

  return (
    <section
      className={`tt-plan-nested ${dragState ? 'tt-plan-nested-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        maybeSwitchPeriodFromPointer(event.clientX)
      }}
    >
      {moveError ? <p className="tt-error">{moveError}</p> : null}
      {isPending && dragState ? <p className="tt-empty">Switching statement period… keep dragging to adjust.</p> : null}
      <div className="tt-plan-nested-sections">
        {ACCOUNT_ORDER.map((account) => (
          <section
            key={account}
            className={`tt-plan-nested-section ${activeDropAccount === account ? 'tt-plan-nested-section-active' : ''}`}
            onDragOver={(event) => {
              if (!dragState || account === dragState.sourceAccount || canCrossAccountTransfer(account)) {
                event.preventDefault()
                setActiveDropAccount(account)
                setActiveDropCategoryKey(null)
              }
            }}
            onDragLeave={() => {
              setActiveDropAccount((current) => (current === account ? null : current))
            }}
            onDrop={(event) => {
              event.preventDefault()
              setActiveDropCategoryKey(null)
              void handleDropOnAccount(account)
            }}
          >
            <h3 className="tt-plan-nested-header">{ACCOUNT_LABELS[account]}</h3>
            {!planningSummary.isPending && !planningSummary.isError ? (
              <HorizontalTriRingStat
                planned={toCriticalitySummary(planningSummary.model, account, 'planned')}
                essential={toCriticalitySummary(planningSummary.model, account, 'essential')}
                nonessential={toCriticalitySummary(planningSummary.model, account, 'nonessential')}
              />
            ) : null}
            {byAccount[account].length === 0 ? (
              <p className="tt-empty">No projected transactions.</p>
            ) : (
              <div className="tt-plan-nested-categories">
                {byAccount[account].map((row) => {
                  const rowKey = `${account}:${row.category}`
                  const isExpanded = expanded[rowKey] ?? true
                  return (
                    <div
                      key={rowKey}
                      className={`tt-plan-nested-category ${activeDropCategoryKey === rowKey ? 'tt-plan-nested-category-active' : ''}`}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setActiveDropAccount(account)
                        setActiveDropCategoryKey(rowKey)
                      }}
                      onDragLeave={() => {
                        setActiveDropCategoryKey((current) => (current === rowKey ? null : current))
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        void handleDropOnAccount(account, row.category)
                      }}
                    >
                      <button
                        type="button"
                        className="tt-plan-nested-category-toggle"
                        aria-expanded={isExpanded}
                        onClick={() => toggleCategory(account, row.category)}
                      >
                        <span>{row.category}</span>
                        <strong>{formatCurrency(row.total)}</strong>
                      </button>
                      {isExpanded ? (
                        <div className="tt-plan-nested-items">
                          {row.children.map((tx, index) => {
                            const key = tx.id != null ? `${tx.id}` : `${rowKey}-${index}`
                            const title = tx.description || tx.name || 'Projected transaction'
                            return (
                              <div
                                key={key}
                                className="tt-plan-nested-item"
                                draggable={!busy}
                                role="button"
                                tabIndex={0}
                                onClick={() => openEdit(tx, account)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    openEdit(tx, account)
                                  }
                                }}
                                onDragStart={() => {
                                  setDragState({
                                    transaction: tx,
                                    sourceAccount: account,
                                    sourceTransactionAccount: normalizeAccount(tx.account),
                                    sourcePeriod: statementPeriod,
                                    lastPeriodSwitchAt: 0,
                                  })
                                  setMoveError(null)
                                  setBlockedMoveMessage(null)
                                }}
                                onDragEnd={() => {
                                  setActiveDropCategoryKey(null)
                                  setActiveDropAccount(null)
                                  setDragState(null)
                                }}
    >
                                <span className="tt-plan-nested-item-title">{title}</span>
                                <strong>{formatCurrency(Number(tx.amount) || 0)}</strong>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        ))}
      </div>
      <Modal isOpen={isModalOpen} title="Edit projected transaction" onClose={closeModal}>
        <form className="tt-proj-form" onSubmit={onSubmit}>
          {formError ? <div className="tt-error">{formError}</div> : null}
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
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
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
                  onChange={(event) => {
                    const next = normalizeCurrencyInput(event.target.value)
                    setForm((current) => ({ ...current, amount: next }))
                  }}
                  onBlur={() => {
                    setForm((current) => ({ ...current, amount: formatCurrencyForInput(current.amount) }))
                  }}
                  placeholder="0.00"
                  required
                />
              </div>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Category *</span>
              <select className="tt-proj-input" value={form.category} onChange={handleCategoryChange} required>
                <option value="" disabled>Select a category…</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Criticality</span>
              <select
                className="tt-proj-input"
                value={form.criticality_id ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setForm((current) => ({ ...current, criticality_id: value ? Number(value) : undefined }))
                }}
              >
                <option value="">—</option>
                {Object.entries(CRITICALITY_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Payment method</span>
              <select
                className="tt-proj-input"
                value={form.paymentMethod}
                onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
              >
                <option value="">—</option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>{paymentMethod}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="tt-proj-form-actions">
            <button type="button" className="tt-proj-secondary" onClick={closeModal} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="tt-proj-primary" disabled={busy}>
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={Boolean(blockedMoveMessage)}
        title="Move not allowed"
        onClose={() => setBlockedMoveMessage(null)}
      >
        <p className="tt-empty" style={{ marginBottom: 12 }}>{blockedMoveMessage}</p>
        <div className="tt-proj-form-actions">
          <button
            type="button"
            className="tt-proj-primary"
            onClick={() => setBlockedMoveMessage(null)}
          >
            OK
          </button>
        </div>
      </Modal>
    </section>
  )
}
