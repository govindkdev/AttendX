import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  points?: string[];
  operational?: boolean;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  points,
  operational = true,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#111D30] border border-[#23334A] rounded-2xl p-6 sm:p-7 hover:border-[#3B82F6]/50 hover:bg-[#16243A]/40 transition-all flex flex-col justify-between group h-full relative overflow-hidden ${className}`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 flex items-center justify-center group-hover:scale-105 group-hover:border-[#3B82F6]/40 transition-all">
            <Icon className="w-6 h-6" />
          </div>
          {badge && (
            <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-500/10 text-[#22D3EE] border border-blue-500/20">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-[#F8FAFC] tracking-tight group-hover:text-[#3B82F6] transition-colors mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#A1AEC2] leading-relaxed mb-4">
          {description}
        </p>
      </div>

      {points && points.length > 0 && (
        <ul className="space-y-2 pt-3 border-t border-[#23334A] text-xs text-[#A1AEC2] font-medium relative z-10">
          {points.map((pt, i) => (
            <li key={i} className="flex items-start">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] mr-2 shrink-0 mt-0.5" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Subtle hover gradient sheen */}
      <div className="absolute inset-0 bg-radial-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};
