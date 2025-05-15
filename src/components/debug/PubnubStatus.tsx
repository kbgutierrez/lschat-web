'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PubnubStatusProps {
  isConnected: boolean;
  channelName: string | null;
  error: string | null;
  className?: string;
}

export function PubnubStatus({ 
  isConnected, 
  channelName, 
  error, 
  className 
}: PubnubStatusProps) {
  if (!channelName) return null;
  
  return (
    <div className={cn(
      "px-2 py-1 text-xs flex items-center gap-1.5 rounded-md",
      error ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
        isConnected ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        error ? "bg-red-500" :
          isConnected ? "bg-green-500" : "bg-yellow-500"
      )}></div>
      <span>
        {error ? `Error: ${error}` : 
          isConnected ? `Live on ${channelName}` : `Connecting to ${channelName}...`}
      </span>
    </div>
  );
}
