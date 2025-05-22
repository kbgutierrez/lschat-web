'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isTyping: boolean;
  contactName: string;
  className?: string;
}

export function TypingIndicator({ 
  isTyping, 
  contactName,
  className 
}: TypingIndicatorProps) {
  if (!isTyping) return null;
  
  return (
    <div className={cn(
      "flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 animate-fade-in bg-white/70 dark:bg-gray-800/70 px-3 py-2 rounded-lg", 
      className
    )}>
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{contactName} is typing...</span>
    </div>
  );
}
