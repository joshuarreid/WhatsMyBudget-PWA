import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { config } from '@/config/env'
import { Modal } from '@/components/Modal'
import { useStatementPeriodStore } from '@/store/useStatementPeriodStore'
import { parseStatementPeriod } from '@/utils/statementPeriodWindow'
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
type SectionEditModeState = Record<PlanningAccount, boolean>
type SectionSelectionState = Record<PlanningAccount, string[]>
type ModalMode = 'create' | 'edit'

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

type MoveFormState = {
  statementPeriod: string
  account: PlanningAccount
  category: string
}

const ACCOUNT_ORDER: PlanningAccount[] = ['joint', 'josh', 'anna']
const ACCOUNT_LABELS: Record<PlanningAccount, string> = {
  joint: 'Joint',
  josh: 'Josh',
  anna: 'Anna',
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

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 7h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 7V5.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7v10.2c0 .99.81 1.8 1.8 1.8h4.4c.99 0 1.8-.81 1.8-1.8V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 10.5v5M13.5 10.5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PlanningNestedCategoryTable = ({ statementPeriod }: { statementPeriod?: string }) => {
  const availablePeriods = useStatementPeriodStore((s) => s.availablePeriods)

  const jointQuery = useProjectedTransactions('joint', statementPeriod ? { statementPeriod } : undefined)
  const joshQuery = useProjectedTransactions('josh', statementPeriod ? { statementPeriod } : undefined)
  const annaQuery = useProjectedTransactions('anna', statementPeriod ? { statementPeriod } : undefined)

  const createMutation = useCreateProjectedTransaction()
  const deleteMutation = useDeleteProjectedTransaction()
  const updateMutation = useUpdateProjectedTransaction()

  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [moveError, setMoveError] = useState<string | null>(null)
  const [blockedMoveMessage, setBlockedMoveMessage] = useState<string | null>(null)
  const [sectionEditMode, setSectionEditMode] = useState<SectionEditModeState>({
    joint: false,
    josh: false,
    anna: false,
  })
  const [sectionSelection, setSectionSelection] = useState<SectionSelectionState>({
    joint: [],
    josh: [],
    anna: [],
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('edit')
  const [selected, setSelected] = useState<ProjectedTransaction | undefined>(undefined)
  const [form, setForm] = useState<FormState>(() => toFormState())
  const [formError, setFormError] = useState<string | null>(null)
  const [moveForm, setMoveForm] = useState<MoveFormState>({
    statementPeriod: '',
    account: 'joint',
    category: '',
  })
  const [moveFormError, setMoveFormError] = useState<string | null>(null)
  const movePeriodScrollRef = useRef<HTMLDivElement | null>(null)
  const selectedMovePeriodRef = useRef<HTMLButtonElement | null>(null)

  const planningSummary = usePlanningTopSummaries(statementPeriod)
  const movePlanningSummary = usePlanningTopSummaries(isMoveModalOpen ? moveForm.statementPeriod : undefined)

  const busy = createMutation.isPending || deleteMutation.isPending || updateMutation.isPending
  const categories = config.categories
  const paymentMethods = config.paymentMethods
  const defaultCriticalityMap = config.defaultCriticalityMap
  const defaultPaymentMethodMap = config.defaultPaymentMethodMap

  const byAccount = useMemo(() => {
    return {
      joint: buildSectionRows(jointQuery.data?.projectedTransactions ?? []),
      josh: buildSectionRows(joshQuery.data?.projectedTransactions ?? []),
      anna: buildSectionRows(annaQuery.data?.projectedTransactions ?? []),
    } satisfies Record<PlanningAccount, ReturnType<typeof buildSectionRows>>
  }, [annaQuery.data?.projectedTransactions, jointQuery.data?.projectedTransactions, joshQuery.data?.projectedTransactions])

  const isPending = Boolean(statementPeriod) && (jointQuery.isPending || joshQuery.isPending || annaQuery.isPending)
  const isError = jointQuery.isError || joshQuery.isError || annaQuery.isError

  const movePeriods = useMemo(() => {
    const selectedPeriod = selected?.statementPeriod?.trim()
    const source = selectedPeriod ? [...availablePeriods, selectedPeriod] : availablePeriods
    return sortedUniquePeriods(source)
  }, [availablePeriods, selected?.statementPeriod])

  const moveCategories = useMemo(() => {
    const merged = new Set<string>(categories.map((category) => normalizeCategory(category)))
    const selectedCategory = selected?.category ? normalizeCategory(selected.category) : ''
    if (selectedCategory) merged.add(selectedCategory)
    return Array.from(merged).sort((a, b) => a.localeCompare(b))
  }, [categories, selected])

  useEffect(() => {
    if (!isMoveModalOpen) return
    const container = movePeriodScrollRef.current
    const selectedButton = selectedMovePeriodRef.current
    if (!container || !selectedButton) return

    const left = selectedButton.offsetLeft - (container.clientWidth / 2) + (selectedButton.clientWidth / 2)
    container.scrollTo({ left: Math.max(0, left), behavior: 'auto' })
  }, [isMoveModalOpen, moveForm.statementPeriod, movePeriods])

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
    setModalMode('edit')
    setSelected(resolvedTx)
    setForm(next)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openCreateForAccount = (account: PlanningAccount) => {
    if (!statementPeriod) return
    const projectedDate = statementPeriodToLastDayInputDate(statementPeriod)
    const defaultCategory = config.categories[0] ?? ''
    const mappedCriticality = defaultCriticalityMap[defaultCategory]
    setModalMode('create')
    setSelected(undefined)
    setForm({
      ...toFormState(),
      account,
      statementPeriod,
      projectedDate,
      category: defaultCategory,
      criticality_id: mappedCriticality ? CRITICALITY_IDS[mappedCriticality] : 2,
      paymentMethod: defaultPaymentMethodMap[account] ?? '',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openMoveModal = () => {
    if (!selected || modalMode !== 'edit') return
    setMoveForm({
      statementPeriod: selected.statementPeriod,
      account: (normalizeAccount(selected.account) as PlanningAccount) || 'joint',
      category: normalizeCategory(selected.category),
    })
    setMoveFormError(null)
    setIsModalOpen(false)
    setIsMoveModalOpen(true)
  }

  const toggleSectionEditMode = (account: PlanningAccount) => {
    setSectionEditMode((current) => {
      const next = !current[account]
      if (!next) {
        setSectionSelection((selection) => ({ ...selection, [account]: [] }))
      }
      return { ...current, [account]: next }
    })
  }

  const toggleSectionRowSelection = (account: PlanningAccount, transactionId: string) => {
    setSectionSelection((current) => {
      const set = new Set(current[account])
      if (set.has(transactionId)) {
        set.delete(transactionId)
      } else {
        set.add(transactionId)
      }
      return { ...current, [account]: Array.from(set) }
    })
  }

  const deleteSelectedInSection = async (account: PlanningAccount) => {
    const ids = sectionSelection[account]
    if (ids.length === 0) return
    const ok = window.confirm(`Delete ${ids.length} selected projected transaction${ids.length === 1 ? '' : 's'}?`)
    if (!ok) return
    try {
      await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)))
      setSectionSelection((current) => ({ ...current, [account]: [] }))
      setSectionEditMode((current) => ({ ...current, [account]: false }))
    } catch (error) {
      setMoveError(error instanceof Error ? error.message : 'Failed to delete selected projections.')
    }
  }

  const closeModal = () => {
    if (busy) return
    setIsModalOpen(false)
    setSelected(undefined)
  }

  const closeMoveModal = () => {
    if (busy) return
    setIsMoveModalOpen(false)
    setMoveFormError(null)
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
      if (modalMode === 'create') {
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
      setSelected(undefined)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Request failed.')
    }
  }

  const onMoveSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMoveFormError(null)
    if (!selected?.id) {
      setMoveFormError('Missing transaction id.')
      return
    }
    if (!moveForm.statementPeriod.trim() || !moveForm.category.trim()) {
      setMoveFormError('Please choose statement period, account, and category.')
      return
    }

    const sourceAccount = normalizeAccount(selected.account)
    const targetAccount = moveForm.account
    if (sourceAccount !== targetAccount && !(sourceAccount === 'joint' && (targetAccount === 'josh' || targetAccount === 'anna'))) {
      setBlockedMoveMessage('Only Joint rows can be moved to Josh or Anna. Split rows in Josh/Anna cannot move across owners.')
      return
    }

    const mappedPaymentMethod = defaultPaymentMethodMap[targetAccount] ?? ''
    const targetDate = toProjectedDate(selected, moveForm.statementPeriod)
    const payload: ProjectedTransaction = {
      ...selected,
      account: targetAccount,
      category: normalizeCategory(moveForm.category),
      statementPeriod: moveForm.statementPeriod,
      projectedDate: targetDate,
      transactionDate: targetDate,
      paymentMethod:
        targetAccount === sourceAccount
          ? selected.paymentMethod ?? mappedPaymentMethod
          : mappedPaymentMethod,
    }

    try {
      if (sourceAccount === targetAccount) {
        await updateMutation.mutateAsync({ id: String(selected.id), data: payload })
      } else {
        await deleteMutation.mutateAsync(String(selected.id))
        await createMutation.mutateAsync(payload)
      }
      setIsMoveModalOpen(false)
      setSelected(undefined)
      setMoveFormError(null)
    } catch (error) {
      setMoveFormError(error instanceof Error ? error.message : 'Failed to move projected transaction.')
    }
  }

  const deleteSelectedProjection = async () => {
    const id = selected?.id
    if (modalMode !== 'edit' || id == null || busy) return
    const ok = window.confirm('Delete this projected transaction?')
    if (!ok) return
    try {
      await deleteMutation.mutateAsync(String(id))
      setIsModalOpen(false)
      setSelected(undefined)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to delete projected transaction.')
    }
  }

  if (!statementPeriod) {
    return <p className="tt-empty">Select a statement period to manage projected transactions.</p>
  }

  if (isPending) {
    return <p className="tt-empty">Loading projected transactions...</p>
  }

  if (isError) {
    return <p className="tt-error">Failed to load projected transactions.</p>
  }

  return (
    <section className="tt-plan-nested">
      {moveError ? <p className="tt-error">{moveError}</p> : null}
      <div className="tt-plan-nested-sections">
        {ACCOUNT_ORDER.map((account) => (
          <section key={account} className="tt-plan-nested-section">
            <div className="tt-plan-nested-section-toolbar">
              <h3 className="tt-plan-nested-header">{ACCOUNT_LABELS[account]}</h3>
              <div className="tt-plan-nested-section-actions">
                <button
                  type="button"
                  className={`tt-plan-section-btn ${sectionEditMode[account] ? 'tt-plan-section-btn-active' : ''}`}
                  onClick={() => toggleSectionEditMode(account)}
                >
                  Edit
                </button>
                {sectionEditMode[account] ? (
                  <button
                    type="button"
                    className="tt-plan-section-btn tt-plan-section-btn-danger"
                    onClick={() => void deleteSelectedInSection(account)}
                    disabled={sectionSelection[account].length === 0 || deleteMutation.isPending}
                    aria-label="Delete selected projections"
                    title="Delete selected projections"
                  >
                    <TrashIcon />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="tt-plan-section-btn"
                  onClick={() => openCreateForAccount(account)}
                >
                  + Add
                </button>
              </div>
            </div>
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
                    <div key={rowKey} className="tt-plan-nested-category">
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
                            const projectedId = tx.id != null ? String(tx.id) : undefined
                            const editModeForSection = sectionEditMode[account]
                            const selectedInSection = Boolean(projectedId && sectionSelection[account].includes(projectedId))
                            const isSplitJointRow =
                              account !== 'joint' &&
                              (normalizeAccount(tx.account) === 'joint' ||
                                String(tx.name ?? '').toLowerCase().includes('[split]') ||
                                String(tx.description ?? '').toLowerCase().includes('[split]'))
                            return (
                              <div
                                key={key}
                                className={`tt-plan-nested-item ${isSplitJointRow ? 'tt-plan-nested-item-split' : ''}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (editModeForSection) {
                                    if (!projectedId) return
                                    toggleSectionRowSelection(account, projectedId)
                                    return
                                  }
                                  openEdit(tx, account)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    if (editModeForSection) {
                                      if (!projectedId) return
                                      toggleSectionRowSelection(account, projectedId)
                                      return
                                    }
                                    openEdit(tx, account)
                                  }
                                }}
                              >
                                {editModeForSection ? (
                                  <input
                                    type="checkbox"
                                    className="tt-plan-nested-select"
                                    checked={selectedInSection}
                                    onChange={(event) => {
                                      event.stopPropagation()
                                      if (!projectedId) return
                                      toggleSectionRowSelection(account, projectedId)
                                    }}
                                    onClick={(event) => event.stopPropagation()}
                                    disabled={!projectedId || busy}
                                    aria-label="Select projected row"
                                  />
                                ) : null}
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
      <Modal
        isOpen={isModalOpen}
        title={modalMode === 'create' ? 'Add projected transaction' : 'Edit projected transaction'}
        onClose={closeModal}
        headerActions={modalMode === 'edit' ? (
          <>
            <button
              type="button"
              className="tt-modal-icon-button"
              onClick={openMoveModal}
              disabled={busy || !selected?.id}
            >
              Move
            </button>
            <button
              type="button"
              className="tt-modal-icon-button tt-modal-icon-button-danger"
              aria-label="Delete projected transaction"
              title="Delete projected transaction"
              onClick={() => { void deleteSelectedProjection() }}
              disabled={busy || !selected?.id}
            >
              <TrashIcon />
            </button>
          </>
        ) : undefined}
      >
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
              {modalMode === 'create'
                ? (createMutation.isPending ? 'Creating…' : 'Create')
                : (updateMutation.isPending ? 'Saving…' : 'Save')}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isMoveModalOpen}
        title="Move projected transaction"
        onClose={closeMoveModal}
      >
        <form className="tt-proj-form" onSubmit={onMoveSubmit}>
          {moveFormError ? <div className="tt-error">{moveFormError}</div> : null}
          {!movePlanningSummary.isPending && !movePlanningSummary.isError ? (
            moveForm.account === 'joint' ? (
              <>
                <HorizontalTriRingStat
                  planned={toCriticalitySummary(movePlanningSummary.model, 'josh', 'planned')}
                  essential={toCriticalitySummary(movePlanningSummary.model, 'josh', 'essential')}
                  nonessential={toCriticalitySummary(movePlanningSummary.model, 'josh', 'nonessential')}
                />
                <HorizontalTriRingStat
                  planned={toCriticalitySummary(movePlanningSummary.model, 'anna', 'planned')}
                  essential={toCriticalitySummary(movePlanningSummary.model, 'anna', 'essential')}
                  nonessential={toCriticalitySummary(movePlanningSummary.model, 'anna', 'nonessential')}
                />
              </>
            ) : (
              <HorizontalTriRingStat
                planned={toCriticalitySummary(movePlanningSummary.model, moveForm.account, 'planned')}
                essential={toCriticalitySummary(movePlanningSummary.model, moveForm.account, 'essential')}
                nonessential={toCriticalitySummary(movePlanningSummary.model, moveForm.account, 'nonessential')}
              />
            )
          ) : null}
          <label className="tt-proj-field">
            <span className="tt-proj-label">Statement period</span>
            <div
              ref={movePeriodScrollRef}
              className="tt-plan-period-scroll"
              role="listbox"
              aria-label="Move statement period"
            >
              {movePeriods.map((period) => (
                <button
                  key={period}
                  type="button"
                  ref={moveForm.statementPeriod === period ? selectedMovePeriodRef : null}
                  className={`tt-plan-period-pill ${moveForm.statementPeriod === period ? 'tt-plan-period-pill-active' : ''}`}
                  onClick={() => setMoveForm((current) => ({ ...current, statementPeriod: period }))}
                >
                  {period}
                </button>
              ))}
            </div>
          </label>
          <div className="tt-proj-form-grid">
            <label className="tt-proj-field">
              <span className="tt-proj-label">Account</span>
              <select
                className="tt-proj-input"
                value={moveForm.account}
                onChange={(event) => setMoveForm((current) => ({ ...current, account: event.target.value as PlanningAccount }))}
              >
                {ACCOUNT_ORDER.map((account) => (
                  <option key={account} value={account}>{ACCOUNT_LABELS[account]}</option>
                ))}
              </select>
            </label>
            <label className="tt-proj-field">
              <span className="tt-proj-label">Category</span>
              <select
                className="tt-proj-input"
                value={moveForm.category}
                onChange={(event) => setMoveForm((current) => ({ ...current, category: normalizeCategory(event.target.value) }))}
              >
                {moveCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="tt-plan-move-summary">
            <div className="tt-plan-move-summary-row">
              <span className="tt-plan-move-summary-label">Projected Name</span>
              <strong>{selected?.description || selected?.name || 'Projected transaction'}</strong>
            </div>
            <div className="tt-plan-move-summary-row">
              <span className="tt-plan-move-summary-label">Amount</span>
              <strong>{formatCurrency(Number(selected?.amount) || 0)}</strong>
            </div>
          </div>
          <div className="tt-proj-form-actions">
            <button type="button" className="tt-proj-secondary" onClick={closeMoveModal} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="tt-proj-primary" disabled={busy}>
              {busy ? 'Moving…' : 'Move'}
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
