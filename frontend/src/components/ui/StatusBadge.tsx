import React from 'react';

export type StatusVariant =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED'
  | 'ACTIVE'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'INFO';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const norm = (status || '').toUpperCase();
  const displayLabel = label || norm;

  const getColors = () => {
    switch (norm) {
      case 'PRESENT':
      case 'APPROVED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'ABSENT':
      case 'REJECTED':
      case 'ERROR':
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'LATE':
      case 'PENDING':
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ACTIVE':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'SCHEDULED':
      case 'INFO':
      case 'EXCUSED':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getDotColor = () => {
    switch (norm) {
      case 'PRESENT':
      case 'APPROVED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-emerald-400';
      case 'ABSENT':
      case 'REJECTED':
      case 'ERROR':
      case 'CANCELLED':
        return 'bg-rose-400';
      case 'LATE':
      case 'PENDING':
      case 'WARNING':
        return 'bg-amber-400';
      case 'ACTIVE':
        return 'bg-cyan-400 animate-pulse';
      case 'SCHEDULED':
      case 'INFO':
      case 'EXCUSED':
      default:
        return 'bg-blue-400';
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${getColors()} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor()}`} />
      {displayLabel}
    </span>
  );
};
