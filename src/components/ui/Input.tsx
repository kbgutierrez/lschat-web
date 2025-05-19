'use client';

import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', showPasswordToggle = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = type === 'password';
    const shouldShowPasswordToggle = isPasswordField && showPasswordToggle;
    const inputType = (isPasswordField && showPassword) ? 'text' : type;

    return (
      <div className="w-full relative">
        {label && (
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            type={inputType}
            className={cn(
              "w-full h-11 px-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors",
              error 
                ? "border-red-500 focus:ring-red-500/30 text-red-600" 
                : "border-gray-300 dark:border-gray-600 focus:ring-violet-500/30 focus:border-violet-500",
              "bg-white dark:bg-gray-800 dark:text-white",
              className
            )}
            ref={ref}
            {...props}
          />
          {shouldShowPasswordToggle && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none z-10"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
  </svg>
);
