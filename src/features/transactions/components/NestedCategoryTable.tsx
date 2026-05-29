import { useEffect, useMemo, useState } from 'react'
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

const columns: ColumnDef<NestedTableRow>[] = [
  {
    accessorKey: 'title',
    header: 'Category',
    cell: ({ row, getValue }) => {
      const title = String(getValue() ?? '')
      return row.depth === 0 ? <strong>{title}</strong> : title
    },
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ getValue }) => formatCurrency(Number(getValue() ?? 0)),
  },
]

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

export const NestedCategoryTable = ({ rows = defaultRows }: NestedCategoryTableProps) => {
  const initialExpanded = useMemo(() => getDefaultExpandedState(rows), [rows])
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded)
  const overallTotal = useMemo(() => rows.reduce((sum, row) => sum + row.total, 0), [rows])

  useEffect(() => {
    setExpanded(initialExpanded)
  }, [initialExpanded])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
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

  return (
    <div className="tt-nested-table-wrap" aria-label="Nested category table">
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
    </div>
  )
}







