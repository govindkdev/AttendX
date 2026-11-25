import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  loading = false,
  empty = false,
  emptyMessage = 'No attendance telemetry available for this period',
  className = '',
}) => {
  return (
    <div
      className={`bg-[#111D30] border border-[#23334A] rounded-2xl p-5 sm:p-6 flex flex-col justify-between ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#A1AEC2] mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center space-x-2">{action}</div>}
      </div>

      <div className="flex-1 min-h-[220px] flex items-center justify-center">
        {loading ? (
          <div className="w-full h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : empty ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#64748B]">{emptyMessage}</p>
          </div>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </div>
    </div>
  );
};
