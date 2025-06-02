'use client';

import React from 'react';
import { getInitials } from '@/utils/initials';
import { GroupMessage } from '@/lib/groupsApi';
import { MessageContent } from '@/components/chat/MessageContent';

interface GroupMessageListProps {
  messages: GroupMessage[];
  groupName: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  endRef?: React.RefObject<HTMLDivElement | null>;
  currentUserId?: string | number;
}

export function GroupMessageList({
  messages,
  groupName,
  isLoading,
  error,
  onRetry,
  endRef,
  currentUserId
}: GroupMessageListProps) {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No messages</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start a conversation in {groupName}
          </p>
        </div>
      </div>
    );
  }

  const formatMessageDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return new Date(dateStr.replace('Z', '')).toLocaleString('en-PH', { 
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      });
    } catch (error) {
      return "Unknown time";
    }
  };
  
  const messagesByDate: Record<string, GroupMessage[]> = {};
  
  messages.forEach(message => {
    try {
      const date = new Date(message.created_at);
      
      if (isNaN(date.getTime())) {
        const fallbackKey = "Invalid Date";
        messagesByDate[fallbackKey] = messagesByDate[fallbackKey] || [];
        messagesByDate[fallbackKey].push(message);
        return;
      }
      
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      if (!messagesByDate[dateKey]) {
        messagesByDate[dateKey] = [];
      }
      
      messagesByDate[dateKey].push(message);
    } catch (error) {
      const fallbackKey = "Unknown Date";
      messagesByDate[fallbackKey] = messagesByDate[fallbackKey] || [];
      messagesByDate[fallbackKey].push(message);
    }
  });
  
  const getFormattedDateDisplay = (dateKey: string) => {
    if (dateKey === "Invalid Date" || dateKey === "Unknown Date") {
      return dateKey;
    }
    
    try {
      const [year, month, day] = dateKey.split('-').map(Number);
      
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${(yesterday.getMonth()+1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;
      
      if (dateKey === todayKey) {
        return 'Today';
      } else if (dateKey === yesterdayKey) {
        return 'Yesterday';
      } else {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[month-1]} ${day}, ${year}`;
      }
    } catch (error) {
      return dateKey;
    }
  };

  return (
    <div className="space-y-6"> 
      {Object.entries(messagesByDate).map(([dateKey, dateMessages]) => (
        <div key={dateKey} className="space-y-4">
          <div className="flex justify-center my-4">
            <div className="px-3 py-1 bg-violet-100 dark:bg-gray-800 rounded-full">
              <span className="text-xs text-black dark:text-gray-400">
                {getFormattedDateDisplay(dateKey)}
              </span>
            </div>
          </div>
          
          {dateMessages.map((message) => {33
            const isOwn = currentUserId !== undefined && 
                          message.sender_id !== undefined && 
                          message.sender_id.toString() === currentUserId.toString();
            const stableKey = `${message.id || ''}:${message.sender_id}:${message.created_at}`;
            
            return (
              <div 
                key={stableKey}
                className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
              >
                {!isOwn && (
                  <div className="flex-shrink-0 w-9 h-9 pt-0.5 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center
                   text-violet-700 dark:text-violet-300 text-sm font-medium overflow-hidden">
                    {getInitials(message.sender_name)}
                  </div>
                )}

                <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">{message.sender_name}</span>
                  )}
                  <div className={`px-3 py-2 rounded-lg ${
                    isOwn 
                      ? "bg-violet-200 dark:bg-violet-600 text-gray-800 dark:text-white" 
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}>
                    <MessageContent content={message.message} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatMessageDate(message.created_at)}</span>
                </div>

                {isOwn && (
                  <div className="flex-shrink-0 w-8 h-8 pt-0.5 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                    {getUserInitials()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
