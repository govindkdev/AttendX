import React from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { FileSpreadsheet } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching this criteria.',
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full bg-[#111D30] border border-[#23334A] rounded-2xl overflow-hidden p-8 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#A1AEC2]">Loading records...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={FileSpreadsheet}
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-[#111D30] border border-[#23334A] rounded-2xl overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#0D1525] border-b border-[#23334A]">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#A1AEC2] ${
                    col.headerClassName || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#23334A]/60">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#16243A]/70'
                    : 'hover:bg-[#16243A]/40'
                }`}
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-5 py-3.5 text-xs text-[#F8FAFC] ${
                      col.className || ''
                    }`}
                  >
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? '')
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
