import { useEffect, useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable, type ColumnDef, type ExpandedState, type Row } from '@tanstack/react-table'

type NestedTableRow = {
  id: string
  title: string
  description?: string
  children?: NestedTableRow[]
}

type NestedCategoryTableSkeletonProps = {
  rows?: NestedTableRow[]
}

const defaultRows: NestedTableRow[] = [
  {
    id: 'main-dish',
    title: 'Main dish',
    description: 'This is a description for this category',
    children: [
      { id: 'main-dish-rice', title: 'Rice' },
      { id: 'main-dish-spaghetti', title: 'Spaghetti' },
      { id: 'main-dish-swallow', title: 'Swallow' },
    ],
  },
  {
    id: 'beans',
    title: 'Beans',
    description: 'This is a description for this category',
    children: [
      { id: 'beans-village', title: 'Village beans' },
      { id: 'beans-white', title: 'White beans' },
      { id: 'beans-soya', title: 'Soya beans' },
    ],
  },
]

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

const getBranchClassName = (row: Row<NestedTableRow>) => {
  const parentRow = row.getParentRow()
  const isLast = parentRow ? row.index === parentRow.subRows.length - 1 : false

  return `tt-nested-branch ${isLast ? 'tt-nested-branch-last' : ''}`
}

const columns: ColumnDef<NestedTableRow>[] = [
  {
    id: 'select',
    header: () => <span className="sr-only">Select rows</span>,
    cell: ({ row }) => {
      if (row.depth > 0) return null

      return <input type="checkbox" aria-label={`Select ${row.original.title}`} />
    },
  },
  {
    id: 'expand',
    header: () => <span className="sr-only">Expand rows</span>,
    cell: ({ row }) => {
      if (row.getCanExpand()) {
        return (
          <button
            type="button"
            className="tt-nested-toggle"
            onClick={row.getToggleExpandedHandler()}
            aria-expanded={row.getIsExpanded()}
            aria-label={`${row.getIsExpanded() ? 'Collapse' : 'Expand'} ${row.original.title}`}
          >
            {row.getIsExpanded() ? '-' : '+'}
          </button>
        )
      }

      if (row.depth > 0) {
        return <span aria-hidden className={getBranchClassName(row)} />
      }

      return null
    },
  },
  {
    accessorKey: 'title',
    header: 'Category Title',
    cell: ({ row, getValue }) => {
      const title = String(getValue() ?? '')
      return row.depth === 0 ? <strong>{title}</strong> : title
    },
  },
  {
    accessorKey: 'description',
    header: 'Category description',
    cell: ({ getValue }) => String(getValue() ?? ''),
  },
]

const getCellClassName = (columnId: string) => {
  switch (columnId) {
    case 'select':
      return 'tt-nested-checkbox-cell'
    case 'expand':
      return 'tt-nested-toggle-cell'
    case 'title':
      return 'tt-nested-title-cell'
    case 'description':
      return 'tt-nested-description-cell'
    default:
      return undefined
  }
}

export const NestedCategoryTableSkeleton = ({ rows = defaultRows }: NestedCategoryTableSkeletonProps) => {
  const initialExpanded = useMemo(() => getDefaultExpandedState(rows), [rows])
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded)

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
              className={`tt-nested-row ${row.depth === 0 ? 'tt-nested-row-parent' : 'tt-nested-row-child'}`}
              data-depth={row.depth}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={getCellClassName(cell.column.id)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}




