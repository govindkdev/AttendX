import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface PortalCardProps {
  title: string;
  roleSubtitle: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  buttonText: string;
  onSelect: () => void;
  accentColor?: 'blue' | 'purple' | 'cyan';
  badge?: string;
  className?: string;
}

export const PortalCard: React.FC<PortalCardProps> = ({
  title,
  roleSubtitle,
  description,
  icon: Icon,
  features,
  buttonText,
  onSelect,
  accentColor = 'blue',
  badge,
  className = '',
}) => {
  const getTheme = () => {
    switch (accentColor) {
      case 'purple':
        return {
          iconBg: 'bg-purple-500/10 text-[#8B5CF6] border-purple-500/25',
          btnBg: 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-95 text-white',
          hoverBorder: 'hover:border-purple-500/50',
          bulletColor: 'text-[#8B5CF6]',
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-500/10 text-[#22D3EE] border-cyan-500/25',
          btnBg: 'bg-gradient-to-r from-[#2563EB] to-[#22D3EE] hover:opacity-95 text-white',
          hoverBorder: 'hover:border-cyan-500/50',
          bulletColor: 'text-[#22D3EE]',
        };
      case 'blue':
      default:
        return {
          iconBg: 'bg-blue-500/10 text-[#3B82F6] border-blue-500/25',
          btnBg: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
          hoverBorder: 'hover:border-blue-500/50',
          bulletColor: 'text-[#3B82F6]',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`bg-[#111D30] border border-[#23334A] rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 ${theme.hoverBorder} group relative overflow-hidden ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-6">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${theme.iconBg} group-hover:scale-105 transition-transform`}
          >
            <Icon className="w-7 h-7" />
          </div>
          {badge && (
            <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#16243A] text-[#A1AEC2] border border-[#23334A]">
              {badge}
            </span>
          )}
        </div>

        <span className="text-xs font-semibold uppercase tracking-wider text-[#A1AEC2] block mb-1">
          {roleSubtitle}
        </span>
        <h3 className="text-2xl font-bold text-[#F8FAFC] tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#A1AEC2] leading-relaxed mb-6">
          {description}
        </p>

        <div className="pt-4 border-t border-[#23334A] mb-8">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-3">
            Portal Capabilities
          </span>
          <ul className="space-y-2.5">
            {features.map((feat, i) => (
              <li key={i} className="flex items-start text-xs sm:text-sm text-[#A1AEC2]">
                <CheckCircle2
                  className={`w-4 h-4 mr-2.5 shrink-0 mt-0.5 ${theme.bulletColor}`}
                />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <button
          onClick={onSelect}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all group-hover:translate-y-[-1px] ${theme.btnBg}`}
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
