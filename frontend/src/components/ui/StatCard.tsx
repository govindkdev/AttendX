import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  accentColor?: 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  accentColor = 'blue',
  onClick,
  className = '',
}) => {
  const getIconWrapper = () => {
    switch (accentColor) {
      case 'purple':
        return 'bg-purple-500/10 text-[#8B5CF6] border-purple-500/20';
      case 'cyan':
        return 'bg-cyan-500/10 text-[#22D3EE] border-cyan-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 text-[#22C55E] border-emerald-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-[#F59E0B] border-amber-500/20';
      case 'rose':
        return 'bg-rose-500/10 text-[#EF4444] border-rose-500/20';
      case 'blue':
      default:
        return 'bg-blue-500/10 text-[#3B82F6] border-blue-500/20';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#111D30] border border-[#23334A] rounded-2xl p-5 hover:border-[#3B82F6]/40 transition-all group ${
        onClick ? 'cursor-pointer hover:bg-[#16243A]/50' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${getIconWrapper()} group-hover:scale-105 transition-transform`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="font-stats text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          {value}
        </div>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              change.trend === 'up'
                ? 'text-emerald-400'
                : change.trend === 'down'
                ? 'text-rose-400'
                : 'text-[#A1AEC2]'
            }`}
          >
            {change.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
            {change.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {change.trend === 'neutral' && <Minus className="w-3.5 h-3.5 mr-1" />}
            {change.value}
          </span>
        )}
      </div>

      {(subtitle || change?.label) && (
        <p className="mt-2 text-xs text-[#64748B] flex items-center">
          {subtitle || change?.label}
        </p>
      )}
    </div>
  );
};
