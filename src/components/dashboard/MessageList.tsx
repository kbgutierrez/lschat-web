'use client';

import React from 'react';
import { MessageItem, Message } from './MessageItem';
import { getInitials } from '@/utils/initials';

interface MessageListProps {
  messages: Message[];
  contactName: string;
  contactPicture?: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  endRef?: React.RefObject<HTMLDivElement | null>;
  currentUserId?: string | number;
  onReplyToMessage?: (messageId: string) => void;
  searchQuery?: string; // Add search query prop
}

export function MessageList({
  messages,
  contactName,
  contactPicture,
  isLoading,
  error,
  onRetry,
  endRef,
  currentUserId,
  onReplyToMessage,
  searchQuery = '' // Default empty string
}: MessageListProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const getUserInitials = () => {
    try {
      const userData = localStorage.getItem('userSession');
      if (userData) {
        const parsed = JSON.parse(userData);
        const user = parsed.user || parsed;

        const firstName = user.firstName || user.first_name || '';
        const lastName = user.lastName || user.last_name || '';

        if (firstName || lastName) {
          return getInitials(`${firstName} ${lastName}`.trim());
        }

        if (user.username) {
          return getInitials(user.username);
        }
      }
    } catch (e) {
      console.error("Error parsing user session data:", e);
    }
    return "U";
  };

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          contactName={contactName}
          contactPicture={contactPicture}
          userInitials={getUserInitials()}
          currentUserId={currentUserId}
          onReplyToMessage={onReplyToMessage}
          searchQuery={searchQuery} // Pass search query to MessageItem
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
