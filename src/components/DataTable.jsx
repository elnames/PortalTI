import React, { useState, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  entriesOptions = [10, 20, 50, 100],
  enableRowSelection = false,
  actions = null,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
  onRowClick,
}) {


  const columnHelper = createColumnHelper();

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: entriesOptions[0],
  });
  const [internalRowSelection, setInternalRowSelection] = useState({});

  const effectiveRowSelection = externalRowSelection ?? internalRowSelection;

  // ref para el checkbox header
  const headerCheckboxRef = useRef();

  const table = useReactTable({
    data,
    columns: [
      ...(enableRowSelection
        ? [
          columnHelper.display({
            id: 'select',
            header: ({ table }) => (
              <input
                type="checkbox"
                ref={headerCheckboxRef}
                checked={table.getIsAllRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            ),
            cell: ({ row }) => (
              <input
                type="checkbox"
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onChange={row.getToggleSelectedHandler()}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            ),
          }),
        ]
        : []),
      ...columns,
    ],
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection: effectiveRowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange:
      onRowSelectionChange ?? setInternalRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection,
    globalFilterFn: 'includesString',
  });

  // Resetear página cuando cambien los datos
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [data?.length]);

  // ajusta la propiedad indeterminate del checkbox
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        table.getIsSomeRowsSelected();
    }
  }, [table]);

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination({
      pageIndex: 0,
      pageSize: newPageSize,
    });
  };

  return (
    <div className="p-2 sm:p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
      {/* Controles superiores + tabla y búsqueda en el mismo scroll */}
      <div className="overflow-x-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 text-sm gap-2 min-w-max">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2">
              <span className="whitespace-nowrap">Mostrar</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 pl-2 pr-8 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                {entriesOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="whitespace-nowrap">registros</span>
            </div>
            {actions && (
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {actions}
              </div>
            )}
          </div>
          <div className="w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <label className="whitespace-nowrap">Buscar:</label>
              <input
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar..."
                className="border border-gray-300 dark:border-gray-600 px-2 py-1 rounded w-full sm:w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Tabla con scroll horizontal */}
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded-lg">
          <table className="w-full table-auto border-collapse min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer select-none border-b border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted()] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.original?.id || row.id}
                  className={`border-b border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group ${onRowClick ? 'cursor-pointer hover:shadow-sm' : ''
                    }`}
                  onClick={() => handleRowClick(row)}
                  title={onRowClick ? 'Hacer clic para ver detalles' : undefined}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <td key={cell.id} className="px-2 sm:px-3 py-2 text-sm text-gray-900 dark:text-gray-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="truncate">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        </div>
                        {onRowClick && cellIndex === 0 && (
                          <ExternalLink className="w-3 h-3 text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mt-4 text-sm">
        <div className="text-gray-700 dark:text-gray-300 text-center sm:text-left">
          Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          de {table.getFilteredRowModel().rows.length} resultados
        </div>
        <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs sm:text-sm"
          >
            {'<<'}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs sm:text-sm"
          >
            {'<'}
          </button>
          <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-2">
            Página{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} de{' '}
              {table.getPageCount() || 1}
            </strong>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs sm:text-sm"
          >
            {'>'}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs sm:text-sm"
          >
            {'>>'}
          </button>
        </div>
      </div>
    </div>
  );
}
