import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { FormInput } from './FormInput';
import type { FormInputProps } from './FormInput';

export interface PasswordInputProps extends Omit<FormInputProps, 'type' | 'rightElement'> {
  showStrength?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ icon = Lock, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <FormInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        icon={icon}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[#64748B] hover:text-[#A1AEC2] focus:outline-none p-1 rounded-md"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
