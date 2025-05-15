'use client';

import React, { memo } from 'react';
import { MessageItem, Message } from './MessageItem';

// Memoize the message list to prevent re-renders
export const MessageList = memo(({ 
  messages, 
  contactName, 
  isLoading, 
  error, 
  onRetry, 
  endRef 
}: { 
  messages: Message[], 
  contactName: string,
  isLoading: boolean,
  error: string | null,
  onRetry: () => void,
  endRef: React.RefObject<HTMLDivElement | null>
}) => {
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-violet-50/80 dark:bg-gray-950/80 backdrop-blur-[1px] z-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
        rounded-md p-4 text-center text-red-600 dark:text-red-400">
        <p>{error}</p>
        <button 
          onClick={onRetry}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 dark:bg-gray-800 rounded-full mb-4">
          <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          contactName={contactName}
          isFirst={index === 0}
          prevTime={index > 0 ? messages[index - 1].time : null}
        />
      ))}
      <div ref={endRef} className="h-1" />
    </div>
  );
});

MessageList.displayName = 'MessageList';
