import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-[#23334A] bg-[#0D1525]/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#16243A] text-[#3B82F6] border border-[#23334A] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#F8FAFC]">{title}</h3>
      <p className="mt-1 text-xs sm:text-sm text-[#A1AEC2] max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
