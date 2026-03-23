'use client';
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/lib/schemas';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  actions?: (row: T) => React.ReactNode;
  searchKeys?: (keyof T)[];
  emptyMessage?: string;
  // Server-side pagination — pass when backend handles paging
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  searchKeys = [],
  emptyMessage = 'No records found',
  pagination,
  onPageChange,
  onLimitChange,
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);
  const [clientLimit, setClientLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const isServerPaged = !!pagination && !!onPageChange;

  const processed = useMemo(() => {
    let rows = data;
    if (!isServerPaged && search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        (searchKeys.length ? searchKeys : Object.keys(row) as (keyof T)[]).some((k) =>
          String(row[k] ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[sortKey] ?? '');
        const bv = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [data, search, searchKeys, sortKey, sortDir, isServerPaged]);

  const clientPaged = useMemo(() => {
    if (isServerPaged) return processed;
    const start = (clientPage - 1) * clientLimit;
    return processed.slice(start, start + clientLimit);
  }, [processed, clientPage, clientLimit, isServerPaged]);

  const displayRows = isServerPaged ? data : clientPaged;
  const totalRecords = isServerPaged ? pagination.totalItems : processed.length;
  const currentPage = isServerPaged ? pagination.currentPage : clientPage;
  const currentTotalPages = isServerPaged ? pagination.totalPages : Math.max(1, Math.ceil(processed.length / clientLimit));
  const currentLimit = isServerPaged ? pagination.itemsPerPage : clientLimit;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    if (!isServerPaged) setClientPage(1);
  };

  const goToPage = (p: number) => {
    if (isServerPaged) onPageChange(p);
    else setClientPage(p);
  };

  const handleLimitChange = (l: number) => {
    if (isServerPaged) onLimitChange?.(l);
    else { setClientLimit(l); setClientPage(1); }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
          <input
            className="form-input pl-9 text-sm"
            placeholder="Search records..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setClientPage(1); }}
          />
        </div>
        <span className="label-text ml-auto whitespace-nowrap">{totalRecords} record{totalRecords !== 1 ? 's' : ''}</span>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-ink-200 bg-white">
        <table className="data-table w-full min-w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(col.sortable && 'cursor-pointer select-none hover:bg-ink-100')}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="w-24">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-ink-400 text-sm italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayRows.map((row, i) => (
                <tr key={String(row.id ?? i)} className="animate-fade-in">
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && <td><div className="flex items-center gap-1">{actions(row)}</div></td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {displayRows.length === 0 ? (
          <div className="card p-4 text-center text-ink-400 text-sm italic">{emptyMessage}</div>
        ) : (
          displayRows.map((row, i) => (
            <div key={String(row.id ?? i)} className="card p-4 animate-fade-in">
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-start gap-3 text-sm">
                    <span className="label-text flex-shrink-0">{col.header}</span>
                    <span className="text-right text-ink-800 break-all">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
              {actions && (
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-ink-100">
                  {actions(row)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="label-text">Rows per page</span>
          <select
            className="form-input !w-auto !py-1.5 text-xs"
            value={currentLimit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-icon disabled:opacity-30" disabled={currentPage === 1} onClick={() => goToPage(1)}>
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button className="btn-icon disabled:opacity-30" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1.5 text-sm text-ink-600 font-mono">{currentPage} / {currentTotalPages}</span>
          <button className="btn-icon disabled:opacity-30" disabled={currentPage === currentTotalPages} onClick={() => goToPage(currentPage + 1)}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="btn-icon disabled:opacity-30" disabled={currentPage === currentTotalPages} onClick={() => goToPage(currentTotalPages)}>
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
