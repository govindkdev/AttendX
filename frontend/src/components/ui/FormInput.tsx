import React, { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      rightElement,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#A1AEC2]"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-xl">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#0D1525] border ${
              error
                ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20'
                : 'border-[#23334A] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20'
            } text-[#F8FAFC] placeholder-[#64748B] text-sm rounded-xl py-2.5 px-3.5 transition-all focus:outline-none focus:ring-2 ${
              Icon ? 'pl-10' : ''
            } ${rightElement ? 'pr-11' : ''} ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-[#EF4444] font-medium mt-1">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-[#64748B] mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
