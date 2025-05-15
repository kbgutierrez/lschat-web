'use client';

import React from 'react';
import { MessageItem, Message } from './MessageItem';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  contactName: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  endRef?: React.RefObject<HTMLDivElement | null>;
}

export function MessageList({
  messages,
  contactName,
  isLoading,
  error,
  onRetry,
  endRef,
}: MessageListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-400 border-t-transparent"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 max-w-md">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading messages</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-full text-center">
        <div className="max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No messages</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start a conversation with {contactName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4"> {/* Removed width classes */}
      {messages.map((message, index) => (
        <MessageItem
          key={message.id || index}
          message={message}
          contactName={contactName}
          showAvatar={true} // Always show avatar
          isConsecutive={false} // Never mark as consecutive
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
