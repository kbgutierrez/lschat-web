'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'fun';
  className?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  href,
  variant = 'primary',
  className = '',
  target,
  rel,
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = "rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 transition-all flex items-center justify-center touch-action-manipulation";
  
  const variantStyles = {
    primary: "bg-[#6B21A8] text-white gap-2 hover:bg-[#5B1B98] dark:hover:bg-[#7B31B8] shadow-lg hover:shadow-purple-500/30",
    secondary: "border border-solid border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent",
    fun: "bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 active:scale-95 transition-all duration-200 shadow-lg"
  };
  
  const buttonClasses = cn(
    baseStyles, 
    variantStyles[variant], 
    disabled && "opacity-70 cursor-not-allowed",
    fullWidth && "w-full",
    className
  );
  
  if (href) {
    return (
      <Link 
        href={href}
        className={buttonClasses}
        target={target}
        rel={rel}
      >
        {children}
      </Link>
    );
  }
  
  return (
    <button 
      className={buttonClasses} 
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
