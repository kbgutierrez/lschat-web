'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { MessageContent } from '@/components/chat/MessageContent';

export type Message = {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
  type?: string;
  isRead?: boolean;
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const compareMessageTimestamps = (timeA: string, timeB: string): boolean => {
  try {
    return timeA !== timeB;
  } catch (e) {
    return true;
  }
};

// Memoize the message component to prevent re-renders
export const MessageItem = memo(({ message, contactName, isFirst, prevTime }: { 
  message: Message, 
  contactName: string,
  isFirst: boolean,
  prevTime: string | null
}) => {
  const showAvatar = isFirst || 
    (!message.isOwn && prevTime && compareMessageTimestamps(message.time, prevTime));

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
      {!message.isOwn && (
        <div className="flex-shrink-0 mr-3">
          {showAvatar && (
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "bg-blue-500 text-white"
            )}>
              <span className="text-xs font-medium">{getInitials(contactName)}</span>
            </div>
          )}
        </div>
      )}

      <div className={cn(
        "max-w-[85%]  ",
        message.isOwn ? "items-end" : "items-start",
        "flex flex-col"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-2xl relative",
          message.isOwn
            ? "bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-gray-200 w-full"
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-full",
          message.isOwn ? "rounded-tr-none" : "rounded-tl-none"
        )}>
          <MessageContent 
            content={message.text} 
            className="text-sm"
          />
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {message.time}
          {message.isOwn && message.isRead && (
            <span className="ml-1 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </span>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
