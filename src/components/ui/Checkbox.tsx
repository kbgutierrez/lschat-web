'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500",
            "dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800",
            className
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <label 
            htmlFor={props.id} 
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
