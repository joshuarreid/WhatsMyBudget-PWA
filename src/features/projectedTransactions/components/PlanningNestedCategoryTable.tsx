import { useMemo, useState } from 'react'
import { config } from '@/config/env'
import { useStatementPeriodStore } from '@/store/useStatementPeriodStore'
import { addMonthsToStatementPeriod, parseStatementPeriod } from '@/utils/statementPeriodWindow'
import { statementPeriodToLastDayInputDate } from '@/utils/statementPeriod'
import {
  useCreateProjectedTransaction,
  useDeleteProjectedTransaction,
  useProjectedTransactions,
  useUpdateProjectedTransaction,
} from '../hooks/useProjectedTransactions'
import type { ProjectedTransaction } from '../api/projectedTransactions.types'

type PlanningAccount = 'joint' | 'josh' | 'anna'
type ExpandedState = Record<string, boolean>

type DragState = {
  transaction: ProjectedTransaction
  sourceAccount: PlanningAccount
  sourcePeriod: string
  lastPeriodSwitchAt: number
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

export const PlanningNestedCategoryTable = ({ statementPeriod }: { statementPeriod?: string }) => {
  const setSelectedPeriod = useStatementPeriodStore((s) => s.setSelectedPeriod)
  const setAvailablePeriods = useStatementPeriodStore((s) => s.setAvailablePeriods)

  const jointQuery = useProjectedTransactions('joint', statementPeriod ? { statementPeriod } : undefined)
  const joshQuery = useProjectedTransactions('josh', statementPeriod ? { statementPeriod } : undefined)
  const annaQuery = useProjectedTransactions('anna', statementPeriod ? { statementPeriod } : undefined)

  const createMutation = useCreateProjectedTransaction()
  const deleteMutation = useDeleteProjectedTransaction()
  const updateMutation = useUpdateProjectedTransaction()

  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [activeDropAccount, setActiveDropAccount] = useState<PlanningAccount | null>(null)
  const [activeDropCategoryKey, setActiveDropCategoryKey] = useState<string | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)

  const busy = createMutation.isPending || deleteMutation.isPending || updateMutation.isPending

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
              event.preventDefault()
              setActiveDropAccount(account)
              setActiveDropCategoryKey(null)
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
                                onDragStart={() => {
                                  setDragState({
                                    transaction: tx,
                                    sourceAccount: account,
                                    sourcePeriod: statementPeriod,
                                    lastPeriodSwitchAt: 0,
                                  })
                                  setMoveError(null)
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
    </section>
  )
}
