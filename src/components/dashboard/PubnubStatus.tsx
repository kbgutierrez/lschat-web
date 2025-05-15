import React from 'react';
import { cn } from '@/lib/utils';

interface PubnubStatusProps {
  isConnected: boolean;
  channelId: string | null;
  lastMessage: any;
  className?: string;
}

export function PubnubStatus({
  isConnected,
  channelId,
  lastMessage,
  className
}: PubnubStatusProps) {
  return (
    <div className={cn(
      "text-xs rounded-full px-2 py-1 flex items-center gap-1.5",
      isConnected 
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      className
    )}>
      <span className={cn(
        "w-2 h-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-amber-500"
      )} />
      <span>
        {isConnected ? 'Connected' : 'Connecting'} 
        {channelId && <span className="opacity-50"> - {channelId.substring(0, 8)}...</span>}
      </span>
      
      {lastMessage && (
        <span className="ml-1 font-mono opacity-75">
          [{new Date(lastMessage.received).toLocaleTimeString()}]
        </span>
      )}
    </div>
  );
}
