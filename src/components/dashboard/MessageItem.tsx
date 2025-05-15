'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MessageContent } from '@/components/chat/MessageContent';
import { getInitials } from './ContactItem';

export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
  type: string;
  isRead: boolean;
}

interface MessageItemProps {
  message: Message;
  contactName: string;
  showAvatar: boolean;
  isConsecutive: boolean;
}

export function MessageItem({ message, contactName, showAvatar, isConsecutive }: MessageItemProps) {
  const { text, time, isOwn } = message;

  return (
    <div className={cn(
      "flex gap-2",
      isOwn ? "justify-end" : "justify-start",
    )}>
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-sm font-medium overflow-hidden">
          {getInitials(contactName)}
        </div>
      )}

      {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

      <div className={cn(
        "max-w-[75%] flex flex-col", // Reverted from "w-fit max-w-[65%]"
        isOwn ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-3 py-2 rounded-lg", // Removed w-fit
          isOwn 
            ? "bg-violet-500 dark:bg-violet-600 text-white" 
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        )}>
          <MessageContent content={text} />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{time}</span>
      </div>

      {isOwn && showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
          {getInitials("Me")}
        </div>
      )}

      {isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
