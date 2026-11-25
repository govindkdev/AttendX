import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface AttendanceProgressProps {
  percentage: number;
  attended?: number;
  total?: number;
  targetPercentage?: number;
  showStatusBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circle' | 'bar';
  className?: string;
}

export const AttendanceProgress: React.FC<AttendanceProgressProps> = ({
  percentage,
  attended,
  total,
  targetPercentage = 75,
  showStatusBadge = true,
  size = 'md',
  variant = 'bar',
  className = '',
}) => {
  const isEligible = percentage >= targetPercentage;
  const isWarning = percentage < targetPercentage && percentage >= 60;
  const isCritical = percentage < 60;

  const getColor = () => {
    if (isEligible) return '#22C55E';
    if (isWarning) return '#F59E0B';
    return '#EF4444';
  };

  const color = getColor();

  if (variant === 'circle') {
    const strokeWidth = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
    const radius = size === 'sm' ? 32 : size === 'lg' ? 56 : 44;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="relative inline-flex items-center justify-center">
          <svg
            className="transform -rotate-90"
            width={radius * 2 + strokeWidth * 2}
            height={radius * 2 + strokeWidth * 2}
          >
            {/* Track */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="#16243A"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress indicator */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-stats font-bold text-[#F8FAFC] text-xl sm:text-2xl">
              {percentage.toFixed(1)}%
            </span>
            <span className="text-[10px] text-[#A1AEC2] uppercase font-semibold">
              Attendance
            </span>
          </div>
        </div>

        {showStatusBadge && (
          <div className="mt-3">
            {isEligible ? (
              <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Exam Eligible
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Shortage (&lt;{targetPercentage}%)
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Linear bar variant
  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#A1AEC2]">Attendance Rate</span>
        <div className="flex items-center space-x-2">
          {attended !== undefined && total !== undefined && (
            <span className="text-[#64748B]">
              {attended}/{total} classes
            </span>
          )}
          <span className="font-stats font-bold text-[#F8FAFC]">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="relative w-full h-2.5 bg-[#16243A] rounded-full overflow-hidden border border-[#23334A]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
        />
        {/* Target marker (75%) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#F8FAFC]/40"
          style={{ left: `${targetPercentage}%` }}
          title={`Required: ${targetPercentage}%`}
        />
      </div>

      {showStatusBadge && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#64748B]">Minimum requirement: {targetPercentage}%</span>
          {isEligible ? (
            <span className="text-emerald-400 font-medium">Eligible</span>
          ) : (
            <span className="text-rose-400 font-medium">
              Shortage ({Math.max(0, targetPercentage - percentage).toFixed(1)}% below)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
