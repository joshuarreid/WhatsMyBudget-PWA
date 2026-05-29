import { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import { config } from '@/config/env'
import { useCreateProjectedTransaction, useDeleteProjectedTransaction, useUpdateProjectedTransaction } from '@/features/projectedTransactions'
import type { ProjectedTransaction } from '@/features/projectedTransactions/api/projectedTransactions.types.ts'
import type { BudgetTransaction } from '@/features/transactions/api/transactions.types.ts'
import { statementPeriodToLastDayInputDate, toInputDate } from '@/utils/statementPeriod'
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable, type ColumnDef, type ExpandedState } from '@tanstack/react-table'

type CategoryRow = {
  kind: 'category'
  id: string
  category: string
  title: string
  total: number
  actualTotal: number
  projectedTotal: number
  hasProjected: boolean
  children: ProjectedTransactionRow[]
}

type ProjectedTransactionRow = {
  kind: 'projected-transaction'
  id: string
  title: string
  total: number
  category: string
  transaction: ProjectedTransaction
  projectedTransactionId?: string
}

type NestedTableRow = CategoryRow | ProjectedTransactionRow

type NestedCategoryTableProps = {
  account?: string
  statementPeriod?: string
  actualTransactions?: BudgetTransaction[]
  transactions?: ProjectedTransaction[]
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
}

const formatCurrency = (value: number) => value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const normalizeCategory = (value: unknown) => String(value ?? 'Uncategorized').trim() || 'Uncategorized'

const toProjectedTransactionTitle = (transaction: ProjectedTransaction) =>
  transaction.description?.trim() || transaction.name?.trim() || 'Projected transaction'

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

const toFormState = (tx?: ProjectedTransaction): FormState => {
  return {
    id: tx?.id,
    name: tx?.name ?? '',
    description: tx?.description ?? '',
    amount: tx?.amount != null ? String(tx.amount) : '',
    category: normalizeCategory(tx?.category),
    projectedDate: toInputDate(tx?.projectedDate ?? tx?.projectedTransactionDate),
    statementPeriod: tx?.statementPeriod ?? '',
    account: tx?.account ?? '',
    criticality: tx?.criticality ?? '',
    paymentMethod: tx?.paymentMethod ?? '',
  }
}

const toApiPayload = (form: FormState): ProjectedTransaction => {
  return {
    id: form.id,
    name: form.name.trim() || undefined,
    description: form.description.trim() || undefined,
    amount: Number(form.amount),
    category: normalizeCategory(form.category),
    projectedDate: form.projectedDate,
    statementPeriod: form.statementPeriod.trim(),
    account: form.account.trim(),
    criticality: form.criticality.trim(),
    paymentMethod: form.paymentMethod.trim(),
  }
}

const coerceAmount = (value: unknown) => {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : 0
}

const buildCategoryRows = (actualTransactions: BudgetTransaction[], transactions: ProjectedTransaction[]): CategoryRow[] => {
  const grouped = new Map<string, { actualTotal: number; children: ProjectedTransactionRow[] }>()

  for (const transaction of actualTransactions) {
    const category = normalizeCategory(transaction.category)
    const entry = grouped.get(category) ?? { actualTotal: 0, children: [] }
    entry.actualTotal += coerceAmount(transaction.amount)
    grouped.set(category, entry)
  }

  for (const transaction of transactions) {
    const category = normalizeCategory(transaction.category)
    const entry = grouped.get(category) ?? { actualTotal: 0, children: [] }
    entry.children.push({
      kind: 'projected-transaction',
      id: transaction.id != null ? `projected-${transaction.id}` : `${category}-${entry.children.length}-${transaction.projectedDate ?? transaction.projectedTransactionDate ?? ''}`,
      title: toProjectedTransactionTitle(transaction),
      total: coerceAmount(transaction.amount),
      category,
      transaction,
      projectedTransactionId: transaction.id != null ? String(transaction.id) : undefined,
    })
    grouped.set(category, entry)
  }

  return Array.from(grouped.entries())
    .map<CategoryRow>(([category, entry]) => ({
      kind: 'category',
      id: category,
      category,
      title: category,
      actualTotal: entry.actualTotal,
      projectedTotal: entry.children.reduce((sum, child) => sum + child.total, 0),
      total: entry.actualTotal + entry.children.reduce((sum, child) => sum + child.total, 0),
      hasProjected: entry.children.length > 0,
      children: entry.children,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      return a.category.localeCompare(b.category)
    })
}


const getDefaultExpandedState = (rows: CategoryRow[]): ExpandedState => {
  const expanded: ExpandedState = {}

  const visit = (items: CategoryRow[]) => {
    for (const item of items) {
      if (item.children.length) {
        expanded[item.id] = true
      }
    }
  }

  visit(rows)
  return expanded
}

const getRowClassName = (row: NestedTableRow, depth: number) => {
  const classNames = ['tt-nested-row', depth === 0 ? 'tt-nested-row-parent' : 'tt-nested-row-child']

  if (row.kind === 'category' && row.children.length > 0) {
    classNames.push('tt-nested-row-expandable')
  }

  if (row.kind === 'category' && row.hasProjected) {
    classNames.push('tt-nested-row-parent-projected')
  }

  return classNames.join(' ')
}

const getCellClassName = (columnId: string) => {
  switch (columnId) {
    case 'title':
      return 'tt-nested-title-cell'
    case 'total':
      return 'tt-nested-total-cell'
    default:
      return undefined
  }
}

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16.5 5a1.4 1.4 0 0 0-2 0L4 15.5V20Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m13.5 6 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 7h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 7V5.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7v10.2c0 .99.81 1.8 1.8 1.8h4.4c.99 0 1.8-.81 1.8-1.8V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 10.5v5M13.5 10.5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PlusSquareIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8.5v7M8.5 12h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const NestedCategoryTable = ({ account, statementPeriod, actualTransactions = [], transactions = [] }: NestedCategoryTableProps) => {
  const createMutation = useCreateProjectedTransaction()
  const updateMutation = useUpdateProjectedTransaction()
  const deleteMutation = useDeleteProjectedTransaction()
  const categoryRows = useMemo(() => buildCategoryRows(actualTransactions, transactions), [actualTransactions, transactions])
  const availableCategories = useMemo(() => {
    const configured = config.categories.map(normalizeCategory)
    return configured.length > 0 ? configured : categoryRows.map((row) => row.category)
  }, [categoryRows])
  const paymentMethods = config.paymentMethods
  const defaultCriticalityMap = config.defaultCriticalityMap
  const defaultPaymentMethodMap = config.defaultPaymentMethodMap
  const initialExpanded = useMemo(() => getDefaultExpandedState(categoryRows), [categoryRows])
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded)
  const [editMode, setEditMode] = useState(false)
  const [selectedSubrowIds, setSelectedSubrowIds] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selected, setSelected] = useState<ProjectedTransaction | undefined>(undefined)
  const [form, setForm] = useState<FormState>(() => toFormState())
  const [formError, setFormError] = useState<string | null>(null)
  const overallTotal = useMemo(() => categoryRows.reduce((sum, row) => sum + row.total, 0), [categoryRows])
  const selectedSubrowSet = useMemo(() => new Set(selectedSubrowIds), [selectedSubrowIds])
  const expandableCategoryRows = useMemo(
    () => categoryRows.filter((row) => row.children.length > 0),
    [categoryRows],
  )
  const modalTitle = mode === 'create' ? 'Add projected transaction' : 'Edit projected transaction'
  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  const canSubmit = useMemo(() => {
    if (busy) return false
    if (!form.account.trim()) return false
    if (!form.statementPeriod.trim()) return false
    if (!form.projectedDate) return false
    if (!form.category.trim()) return false
    if (!Number.isFinite(parseCurrencyAmount(form.amount))) return false
    return true
  }, [busy, form])
  const allRowsExpanded = useMemo(() => {
    if (expandableCategoryRows.length === 0) return false
    if (expanded === true) return true

    return expandableCategoryRows.every((row) => Boolean(expanded[row.id]))
  }, [expandableCategoryRows, expanded])

  const openCreateModal = () => {
    const resolvedAccount = account?.trim() ?? ''
    const resolvedStatementPeriod = statementPeriod?.trim() ?? ''
    const projectedDate = resolvedStatementPeriod ? statementPeriodToLastDayInputDate(resolvedStatementPeriod) : ''
    const defaultCategory = availableCategories[0] ?? ''

    setMode('create')
    setSelected(undefined)
    setForm({
      ...toFormState(),
      account: resolvedAccount,
      statementPeriod: resolvedStatementPeriod,
      projectedDate,
      category: defaultCategory,
      criticality: defaultCriticalityMap[defaultCategory] || 'Nonessential',
      paymentMethod: defaultPaymentMethodMap[resolvedAccount] || '',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = useCallback((tx: ProjectedTransaction) => {
    const next = toFormState(tx)

    if (!next.projectedDate && next.statementPeriod) {
      next.projectedDate = statementPeriodToLastDayInputDate(next.statementPeriod)
    }

    if (!next.paymentMethod) {
      next.paymentMethod = defaultPaymentMethodMap[next.account] || defaultPaymentMethodMap[account?.trim() ?? ''] || ''
    }

    if (!next.criticality && next.category) {
      next.criticality = defaultCriticalityMap[next.category] || ''
    }

    setMode('edit')
    setSelected(tx)
    setForm(next)
    setFormError(null)
    setIsModalOpen(true)
  }, [account, defaultCriticalityMap, defaultPaymentMethodMap])

  const columns = useMemo<ColumnDef<NestedTableRow>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Category',
      cell: ({ row, getValue }) => {
        const title = String(getValue() ?? '')
        const original = row.original

        if (original.kind === 'category') {
          return <strong>{title}</strong>
        }

        if (!editMode) {
          return (
            <button
              type="button"
              className="tt-nested-subrow-open"
              onClick={(event) => {
                event.stopPropagation()
                openEditModal(original.transaction)
              }}
            >
              <span className="tt-nested-subrow-text">{title}</span>
            </button>
          )
        }

        return (
          <label
            className="tt-nested-subrow-label tt-nested-subrow-label-edit"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              className="tt-nested-subrow-checkbox"
              checked={Boolean(original.projectedTransactionId && selectedSubrowSet.has(original.projectedTransactionId))}
              disabled={!original.projectedTransactionId || deleteMutation.isPending}
              onChange={(event) => {
                const checked = event.target.checked
                const nextId = original.projectedTransactionId
                if (!nextId) return
                setSelectedSubrowIds((current) =>
                  checked ? [...current, nextId] : current.filter((id) => id !== nextId)
                )
              }}
            />
            <span className="tt-nested-subrow-text">{title}</span>
          </label>
        )
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => formatCurrency(Number(getValue() ?? 0)),
    },
  ], [deleteMutation.isPending, editMode, openEditModal, selectedSubrowSet])

  useEffect(() => {
    setExpanded(initialExpanded)
    setEditMode(false)
    setSelectedSubrowIds([])
    setIsModalOpen(false)
    setMode('create')
    setSelected(undefined)
    setFormError(null)
    setForm(toFormState())
  }, [initialExpanded])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: categoryRows,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.kind === 'category' ? row.children : undefined),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const toggleRow = (rowId: string) => {
    setExpanded((current) => {
      const expandedMap = current === true ? {} : current

      return {
        ...expandedMap,
        [rowId]: !(expandedMap[rowId] ?? false),
      }
    })
  }

  const toggleAllRows = () => {
    if (allRowsExpanded) {
      setExpanded({})
      setEditMode(false)
      setSelectedSubrowIds([])
      return
    }

    setExpanded(getDefaultExpandedState(categoryRows))
  }

  const toggleEditMode = () => {
    setEditMode((current) => {
      const next = !current
      if (next) {
        setExpanded(getDefaultExpandedState(categoryRows))
      } else {
        setSelectedSubrowIds([])
      }
      return next
    })
  }

  const deleteSelectedSubrows = async () => {
    if (selectedSubrowIds.length === 0) return

    const ok = window.confirm(`Delete ${selectedSubrowIds.length} selected subrow${selectedSubrowIds.length === 1 ? '' : 's'}?`)
    if (!ok) return

    try {
      await Promise.all(selectedSubrowIds.map((id) => deleteMutation.mutateAsync(id)))
      setSelectedSubrowIds([])
      setEditMode(false)
    } catch {
      // keep UI simple; query invalidation will refresh successful deletes
    }
  }

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const category = normalizeCategory(event.target.value)
    const mapped = defaultCriticalityMap[category]
    setForm((current) => ({
      ...current,
      category,
      criticality: mapped || current.criticality,
    }))
  }

  const closeModal = () => {
    if (busy) return
    setIsModalOpen(false)
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    setForm((current) => ({ ...current, amount: formatCurrencyForInput(normalizeCurrencyInput(current.amount)) }))

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

      const category = normalizeCategory(payload.category)
      setExpanded((current) => ({
        ...(current === true ? {} : current),
        [category]: true,
      }))
      setIsModalOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Request failed.')
    }
  }

  return (
    <div className="tt-nested-table-wrap" aria-label="Nested category table">
      <div className="tt-nested-toolbar">
        <div className="tt-nested-toolbar-bulk-actions">
          <button
            type="button"
            className="tt-nested-toolbar-text-button"
            onClick={toggleAllRows}
            disabled={expandableCategoryRows.length === 0}
          >
            {allRowsExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
        <div className="tt-nested-toolbar-actions">
          <button
            type="button"
            className={`tt-nested-toolbar-button ${editMode ? 'tt-nested-toolbar-button-active' : ''}`}
            aria-label={editMode ? 'Stop selecting subrows' : 'Select subrows to delete'}
            title={editMode ? 'Stop selecting subrows' : 'Select subrows to delete'}
            onClick={toggleEditMode}
          >
            <PencilIcon />
          </button>
          {editMode && (
            <button
              type="button"
              className="tt-nested-toolbar-button tt-nested-toolbar-button-danger"
              aria-label="Delete selected subrows"
              title="Delete selected subrows"
              onClick={deleteSelectedSubrows}
              disabled={selectedSubrowIds.length === 0 || deleteMutation.isPending}
            >
              <TrashIcon />
            </button>
          )}
          <button
            type="button"
            className="tt-nested-toolbar-button"
            aria-label="Add subrow"
            title="Add subrow"
            onClick={openCreateModal}
            disabled={availableCategories.length === 0 || busy || !account || !statementPeriod}
          >
            <PlusSquareIcon />
          </button>
        </div>
      </div>
      <table className="tt-nested-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className={getCellClassName(header.column.id)}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
               className={getRowClassName(row.original, row.depth)}
              data-depth={row.depth}
              onClick={row.getCanExpand() ? () => toggleRow(row.id) : undefined}
              onKeyDown={row.getCanExpand()
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      toggleRow(row.id)
                    }
                  }
                : undefined}
              tabIndex={row.getCanExpand() ? 0 : undefined}
              role={row.getCanExpand() ? 'button' : undefined}
              aria-expanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={getCellClassName(cell.column.id)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="tt-nested-footer-row">
            <td className="tt-nested-footer-label">Total</td>
            <td className="tt-nested-total-cell tt-nested-footer-total">{formatCurrency(overallTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
        <form className="tt-proj-form" onSubmit={onSubmit}>
          {formError && <div className="tt-error">{formError}</div>}

          <div className="tt-proj-form-grid">
            <label className="tt-proj-field">
              <span className="tt-proj-label">Statement period</span>
              <input
                className="tt-proj-input"
                value={form.statementPeriod}
                disabled
                readOnly
              />
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
              <select
                className="tt-proj-input"
                value={form.category}
                onChange={handleCategoryChange}
                required
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Criticality</span>
              <select
                className="tt-proj-input"
                value={form.criticality}
                onChange={(event) => setForm((current) => ({ ...current, criticality: event.target.value }))}
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
                onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
              >
                <option value="">—</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
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







