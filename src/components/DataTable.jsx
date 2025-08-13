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
import { useSettings } from '../contexts/SettingsContext';

export default function DataTable({
  columns,
  data,
  entriesOptions = [10, 20, 50, 100],
  enableRowSelection = false,
  actions = null,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
  onRowClick,
  onRefresh,
  autoRefresh = false,
  refreshInterval = 30,
}) {


  const columnHelper = createColumnHelper();

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: entriesOptions[0],
  });
  const [internalRowSelection, setInternalRowSelection] = useState({});
  const { settings } = useSettings();

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

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (autoRefresh && onRefresh && settings.tableSettings.autoRefresh) {
      const interval = setInterval(() => {
        onRefresh();
      }, settings.tableSettings.refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh, settings.tableSettings.autoRefresh, settings.tableSettings.refreshInterval]);

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
        {/* Controles superiores reorganizados */}
        <div className="flex flex-col space-y-3 mb-4 text-sm">
          {/* Primera fila: Dropdown "mostrar x registros" y barra de búsqueda */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">📊 Mostrar:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 shadow-sm focus:shadow-md transition-all duration-200 text-sm font-medium hover:shadow-lg transform-gpu"
              >
                {entriesOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">registros</span>
            </div>
            <div className="w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">🔍 Buscar:</label>
                <div className="relative">
                  <input
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar en todos los campos..."
                    className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg w-full sm:w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 shadow-sm focus:shadow-md transition-all duration-200"
                  />
                  {globalFilter && (
                    <button
                      onClick={() => setGlobalFilter('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Segunda fila: Botones de acción */}
          {actions && (
            <div className="flex flex-wrap gap-2 justify-start">
              {actions}
            </div>
          )}
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
        <div className="flex items-center justify-center sm:justify-end space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm font-medium hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md transform-gpu"
          >
            ⏮️
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm font-medium hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md transform-gpu"
          >
            ◀️
          </button>
          <span className="text-gray-700 dark:text-gray-300 text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            Página{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} de{' '}
              {table.getPageCount() || 1}
            </strong>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm font-medium hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md transform-gpu"
          >
            ▶️
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm font-medium hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md transform-gpu"
          >
            ⏭️
          </button>
        </div>
      </div>
    </div>
  );
}
