import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable, type ColumnDef, type ExpandedState } from '@tanstack/react-table'

type NestedTableRow = {
  id: string
  title: string
  total: number
  children?: NestedTableRow[]
}

type NestedCategoryTableProps = {
  rows?: NestedTableRow[]
}

type AddSubrowFormState = {
  parentId: string
  title: string
  total: string
}

const defaultRows: NestedTableRow[] = [
  {
    id: 'main-dish',
    title: 'Main dish',
    total: 79.83,
    children: [
      { id: 'main-dish-rice', title: 'Rice', total: 18.49 },
      { id: 'main-dish-spaghetti', title: 'Spaghetti', total: 24.95 },
      { id: 'main-dish-swallow', title: 'Swallow', total: 36.39 },
    ],
  },
  {
    id: 'beans',
    title: 'Beans',
    total: 52.17,
    children: [
      { id: 'beans-village', title: 'Village beans', total: 17.48 },
      { id: 'beans-white', title: 'White beans', total: 14.22 },
      { id: 'beans-soya', title: 'Soya beans', total: 20.47 },
    ],
  },
]

const formatCurrency = (value: number) => value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

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

const normalizeRows = (items: NestedTableRow[]): NestedTableRow[] => {
  return items.map((item) => {
    const hasChildren = Array.isArray(item.children)
    const children = item.children ? normalizeRows(item.children) : item.children
    const total = hasChildren ? (children?.reduce((sum, child) => sum + child.total, 0) ?? 0) : item.total

    return {
      ...item,
      total,
      children,
    }
  })
}

const buildDefaultAddSubrowForm = (rows: NestedTableRow[]): AddSubrowFormState => ({
  parentId: rows[0]?.id ?? '',
  title: '',
  total: '',
})

const buildSubrowId = (parentId: string) => `${parentId}-subrow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getDefaultExpandedState = (rows: NestedTableRow[]): ExpandedState => {
  const expanded: ExpandedState = {}

  const visit = (items: NestedTableRow[]) => {
    for (const item of items) {
      if (item.children?.length) {
        expanded[item.id] = true
        visit(item.children)
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
    <path
      d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16.5 5a1.4 1.4 0 0 0-2 0L4 15.5V20Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m13.5 6 4.5 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M5 7h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 7V5.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 7v10.2c0 .99.81 1.8 1.8 1.8h4.4c.99 0 1.8-.81 1.8-1.8V7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 10.5v5M13.5 10.5v5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const PlusSquareIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect
      x="4.5"
      y="4.5"
      width="15"
      height="15"
      rx="2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M12 8.5v7M8.5 12h7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const NestedCategoryTable = ({ rows = defaultRows }: NestedCategoryTableProps) => {
  const normalizedRows = useMemo(() => normalizeRows(rows), [rows])
  const parentOptions = useMemo(
    () => normalizedRows.map((row) => ({ id: row.id, title: row.title })),
    [normalizedRows]
  )
  const initialExpanded = useMemo(() => getDefaultExpandedState(normalizedRows), [normalizedRows])
  const [tableRows, setTableRows] = useState<NestedTableRow[]>(normalizedRows)
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded)
  const [editMode, setEditMode] = useState(false)
  const [selectedSubrowIds, setSelectedSubrowIds] = useState<string[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState<AddSubrowFormState>(() => buildDefaultAddSubrowForm(normalizedRows))
  const [addError, setAddError] = useState<string | null>(null)
  const overallTotal = useMemo(() => tableRows.reduce((sum, row) => sum + row.total, 0), [tableRows])
  const selectedSubrowSet = useMemo(() => new Set(selectedSubrowIds), [selectedSubrowIds])

  const columns = useMemo<ColumnDef<NestedTableRow>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Category',
      cell: ({ row, getValue }) => {
        const title = String(getValue() ?? '')

        if (row.depth === 0) {
          return <strong>{title}</strong>
        }

        return (
          <label className="tt-nested-subrow-label" onClick={(event) => event.stopPropagation()}>
            {editMode && (
              <input
                type="checkbox"
                className="tt-nested-subrow-checkbox"
                checked={selectedSubrowSet.has(row.id)}
                onChange={(event) => {
                  const checked = event.target.checked
                  setSelectedSubrowIds((current) =>
                    checked ? [...current, row.id] : current.filter((id) => id !== row.id)
                  )
                }}
              />
            )}
            <span>{title}</span>
          </label>
        )
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => formatCurrency(Number(getValue() ?? 0)),
    },
  ], [editMode, selectedSubrowSet])

  useEffect(() => {
    setTableRows(normalizedRows)
    setExpanded(initialExpanded)
    setEditMode(false)
    setSelectedSubrowIds([])
    setIsAddModalOpen(false)
    setAddError(null)
    setAddForm(buildDefaultAddSubrowForm(normalizedRows))
  }, [initialExpanded, normalizedRows])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableRows,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
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

  const toggleEditMode = () => {
    setEditMode((current) => {
      const next = !current
      if (!next) {
        setSelectedSubrowIds([])
      }
      return next
    })
  }

  const deleteSelectedSubrows = () => {
    if (selectedSubrowIds.length === 0) return

    const ok = window.confirm(`Delete ${selectedSubrowIds.length} selected subrow${selectedSubrowIds.length === 1 ? '' : 's'}?`)
    if (!ok) return

    const selected = new Set(selectedSubrowIds)
    setTableRows((current) => normalizeRows(
      current.map((parent) => ({
        ...parent,
        children: parent.children?.filter((child) => !selected.has(child.id)) ?? [],
      }))
    ))
    setSelectedSubrowIds([])
    setEditMode(false)
  }

  const openAddModal = () => {
    setAddError(null)
    setAddForm((current) => ({
      ...buildDefaultAddSubrowForm(tableRows),
      parentId: current.parentId && parentOptions.some((option) => option.id === current.parentId)
        ? current.parentId
        : tableRows[0]?.id ?? '',
    }))
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setAddError(null)
  }

  const handleAddSubrow = (event: React.FormEvent) => {
    event.preventDefault()
    setAddError(null)

    const normalizedAmount = formatCurrencyForInput(normalizeCurrencyInput(addForm.total))
    const amount = parseCurrencyAmount(normalizedAmount)

    if (!addForm.parentId) {
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

    setTableRows((current) => normalizeRows(
      current.map((parent) => {
        if (parent.id !== addForm.parentId) return parent

        return {
          ...parent,
          children: [
            ...(parent.children ?? []),
            {
              id: buildSubrowId(parent.id),
              title: addForm.title.trim(),
              total: amount,
            },
          ],
        }
      })
    ))
    setExpanded((current) => ({
      ...(current === true ? {} : current),
      [addForm.parentId]: true,
    }))
    setIsAddModalOpen(false)
    setAddForm(buildDefaultAddSubrowForm(tableRows))
  }

  return (
    <div className="tt-nested-table-wrap" aria-label="Nested category table">
      <div className="tt-nested-toolbar">
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
            disabled={!editMode || selectedSubrowIds.length === 0}
          >
            <TrashIcon />
          </button>
          <button
            type="button"
            className="tt-nested-toolbar-button"
            aria-label="Add subrow"
            title="Add subrow"
            onClick={openAddModal}
            disabled={parentOptions.length === 0}
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
                value={addForm.parentId}
                onChange={(event) => setAddForm((current) => ({ ...current, parentId: event.target.value }))}
                required
              >
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
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
            <button type="submit" className="tt-proj-primary" disabled={parentOptions.length === 0}>
              Add subrow
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}







