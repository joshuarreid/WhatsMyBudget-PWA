import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import { config } from '@/config/env'
import { useCreateProjectedTransaction, useDeleteProjectedTransaction } from '@/features/projectedTransactions'
import type { ProjectedTransaction } from '@/features/projectedTransactions/api/projectedTransactions.types.ts'
import { statementPeriodToLastDayInputDate } from '@/utils/statementPeriod'
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable, type ColumnDef, type ExpandedState } from '@tanstack/react-table'

type CategoryRow = {
  kind: 'category'
  id: string
  category: string
  title: string
  total: number
  children: ProjectedTransactionRow[]
}

type ProjectedTransactionRow = {
  kind: 'projected-transaction'
  id: string
  title: string
  total: number
  category: string
  projectedTransactionId?: string
}

type NestedTableRow = CategoryRow | ProjectedTransactionRow

type NestedCategoryTableProps = {
  account?: string
  statementPeriod?: string
  transactions?: ProjectedTransaction[]
}

type AddSubrowFormState = {
  category: string
  title: string
  total: string
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

const buildCategoryRows = (transactions: ProjectedTransaction[]): CategoryRow[] => {
  const grouped = new Map<string, ProjectedTransactionRow[]>()

  for (const transaction of transactions) {
    const category = normalizeCategory(transaction.category)
    const rows = grouped.get(category) ?? []
    rows.push({
      kind: 'projected-transaction',
      id: transaction.id != null ? `projected-${transaction.id}` : `${category}-${rows.length}-${transaction.projectedDate ?? transaction.projectedTransactionDate ?? ''}`,
      title: toProjectedTransactionTitle(transaction),
      total: Number(transaction.amount) || 0,
      category,
      projectedTransactionId: transaction.id != null ? String(transaction.id) : undefined,
    })
    grouped.set(category, rows)
  }

  return Array.from(grouped.entries())
    .map<CategoryRow>(([category, children]) => ({
      kind: 'category',
      id: category,
      category,
      title: category,
      total: children.reduce((sum, child) => sum + child.total, 0),
      children,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      return a.category.localeCompare(b.category)
    })
}

const buildDefaultAddSubrowForm = (categories: string[]): AddSubrowFormState => ({
  category: categories[0] ?? '',
  title: '',
  total: '',
})

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

const getRowClassName = (depth: number) => `tt-nested-row ${depth === 0 ? 'tt-nested-row-parent' : 'tt-nested-row-child'}`

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

export const NestedCategoryTable = ({ account, statementPeriod, transactions = [] }: NestedCategoryTableProps) => {
  const createMutation = useCreateProjectedTransaction()
  const deleteMutation = useDeleteProjectedTransaction()
  const categoryRows = useMemo(() => buildCategoryRows(transactions), [transactions])
  const availableCategories = useMemo(() => {
    const configured = config.categories.map(normalizeCategory)
    return configured.length > 0 ? configured : categoryRows.map((row) => row.category)
  }, [categoryRows])
  const initialExpanded = useMemo(() => getDefaultExpandedState(categoryRows), [categoryRows])
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded)
  const [editMode, setEditMode] = useState(false)
  const [selectedSubrowIds, setSelectedSubrowIds] = useState<string[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState<AddSubrowFormState>(() => buildDefaultAddSubrowForm(availableCategories))
  const [addError, setAddError] = useState<string | null>(null)
  const overallTotal = useMemo(() => categoryRows.reduce((sum, row) => sum + row.total, 0), [categoryRows])
  const selectedSubrowSet = useMemo(() => new Set(selectedSubrowIds), [selectedSubrowIds])
  const allRowsExpanded = useMemo(() => {
    if (categoryRows.length === 0) return false
    if (expanded === true) return true

    return categoryRows.every((row) => Boolean(expanded[row.id]))
  }, [categoryRows, expanded])

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

        return (
          <label
            className={`tt-nested-subrow-label ${editMode ? 'tt-nested-subrow-label-edit' : ''}`}
            onClick={(event) => event.stopPropagation()}
          >
            {editMode && (
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
            )}
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
  ], [deleteMutation.isPending, editMode, selectedSubrowSet])

  useEffect(() => {
    setExpanded(initialExpanded)
    setEditMode(false)
    setSelectedSubrowIds([])
    setIsAddModalOpen(false)
    setAddError(null)
    setAddForm(buildDefaultAddSubrowForm(availableCategories))
  }, [availableCategories, initialExpanded])

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

  const openAddModal = () => {
    setAddError(null)
    setAddForm((current) => ({
      ...buildDefaultAddSubrowForm(availableCategories),
      category: current.category && availableCategories.includes(current.category)
        ? current.category
        : availableCategories[0] ?? '',
    }))
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setAddError(null)
  }

  const handleAddSubrow = async (event: React.FormEvent) => {
    event.preventDefault()
    setAddError(null)

    const normalizedAmount = formatCurrencyForInput(normalizeCurrencyInput(addForm.total))
    const amount = parseCurrencyAmount(normalizedAmount)

    if (!account?.trim()) {
      setAddError('Account is required.')
      return
    }

    if (!statementPeriod?.trim()) {
      setAddError('Statement period is required.')
      return
    }

    if (!addForm.category) {
      setAddError('Please choose a parent category.')
      return
    }

    if (!addForm.title.trim()) {
      setAddError('Please enter a subrow name.')
      return
    }

    if (!Number.isFinite(amount)) {
      setAddError('Please enter a valid amount.')
      return
    }

    const category = normalizeCategory(addForm.category)

    try {
      await createMutation.mutateAsync({
        account: account.trim(),
        statementPeriod: statementPeriod.trim(),
        category,
        criticality: config.defaultCriticalityMap[category] || 'Nonessential',
        paymentMethod: config.defaultPaymentMethodMap[account] || '',
        amount,
        name: addForm.title.trim(),
        description: undefined,
        projectedDate: statementPeriodToLastDayInputDate(statementPeriod),
      })
      setExpanded((current) => ({
        ...(current === true ? {} : current),
        [category]: true,
      }))
      setIsAddModalOpen(false)
      setAddForm(buildDefaultAddSubrowForm(availableCategories))
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Failed to add projected transaction.')
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
            disabled={categoryRows.length === 0}
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
          <button
            type="button"
            className="tt-nested-toolbar-button tt-nested-toolbar-button-danger"
            aria-label="Delete selected subrows"
            title="Delete selected subrows"
            onClick={deleteSelectedSubrows}
            disabled={!editMode || selectedSubrowIds.length === 0 || deleteMutation.isPending}
          >
            <TrashIcon />
          </button>
          <button
            type="button"
            className="tt-nested-toolbar-button"
            aria-label="Add subrow"
            title="Add subrow"
            onClick={openAddModal}
            disabled={availableCategories.length === 0 || createMutation.isPending || !account || !statementPeriod}
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
              className={getRowClassName(row.depth)}
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

      <Modal isOpen={isAddModalOpen} title="Add subrow" onClose={closeAddModal}>
        <form className="tt-proj-form" onSubmit={handleAddSubrow}>
          {addError && <div className="tt-error">{addError}</div>}

          <div className="tt-proj-form-grid">
            <label className="tt-proj-field">
              <span className="tt-proj-label">Parent category *</span>
              <select
                className="tt-proj-input"
                value={addForm.category}
                onChange={(event) => setAddForm((current) => ({ ...current, category: event.target.value }))}
                required
              >
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="tt-proj-field">
              <span className="tt-proj-label">Subrow name *</span>
              <input
                className="tt-proj-input"
                value={addForm.title}
                onChange={(event) => setAddForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="New subrow"
                required
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
                  value={addForm.total}
                  onChange={(event) => setAddForm((current) => ({
                    ...current,
                    total: normalizeCurrencyInput(event.target.value),
                  }))}
                  onBlur={() => setAddForm((current) => ({
                    ...current,
                    total: formatCurrencyForInput(current.total),
                  }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </label>
          </div>

          <div className="tt-proj-form-actions">
            <button type="button" className="tt-proj-secondary" onClick={closeAddModal}>
              Cancel
            </button>
            <button type="submit" className="tt-proj-primary" disabled={availableCategories.length === 0 || createMutation.isPending}>
              {createMutation.isPending ? 'Adding…' : 'Add subrow'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}







