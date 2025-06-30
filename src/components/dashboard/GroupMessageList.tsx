'use client';

import React, { useState, useRef } from 'react';
import { getInitials } from '@/utils/initials';
import { GroupMessage } from '@/lib/groupsApi';
import { MessageContent } from '@/components/chat/MessageContent';
import { ReplyPreview } from '@/components/chat/ReplyPreview';

interface GroupMessageListProps {
  messages: GroupMessage[];
  groupName: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  endRef?: React.RefObject<HTMLDivElement | null>;
  currentUserId?: string | number;
  onReplyToMessage?: (messageId: number) => void;
  searchQuery?: string;
}

export function GroupMessageList({
  messages,
  groupName,
  isLoading,
  error,
  onRetry,
  endRef,
  currentUserId,
  onReplyToMessage
}: GroupMessageListProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [swipingMessageId, setSwipingMessageId] = useState<number | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const swipeStartX = useRef(0);
  const swipeThreshold = 60; 

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
      const todayKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;

      if (dateKey === todayKey) {
        return 'Today';
      } else if (dateKey === yesterdayKey) {
        return 'Yesterday';
      } else {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[month - 1]} ${day}, ${year}`;
      }
    } catch (error) {
      return dateKey;
    }
  };

  // Add these handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent, messageId: number) => {
    swipeStartX.current = e.touches[0].clientX;
    setSwipingMessageId(messageId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipingMessageId === null) return;

    // Find the message being swiped to determine ownership
    const message = messages.find(m => m.id === swipingMessageId);
    if (!message) return;

    // Check if this is the user's own message
    const isOwn = currentUserId !== undefined &&
      message.sender_id !== undefined &&
      message.sender_id.toString() === currentUserId.toString();

    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeStartX.current;

    // Allow swiping right for others' messages, left for own messages
    if ((!isOwn && diff > 0) || (isOwn && diff < 0)) {
      // Use absolute value for the distance to keep consistent behavior
      setSwipeDistance(Math.min(Math.abs(diff), swipeThreshold * 1.5) * (isOwn ? -1 : 1));
    }
  };

  const handleTouchEnd = () => {
    if (swipingMessageId !== null && Math.abs(swipeDistance) >= swipeThreshold && onReplyToMessage) {
      // Trigger reply if swipe distance is enough (using absolute value)
      onReplyToMessage(swipingMessageId);
    }

    // Reset state
    setSwipingMessageId(null);
    setSwipeDistance(0);
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

          {dateMessages.map((message) => {
            const isOwn = currentUserId !== undefined &&
              message.sender_id !== undefined &&
              message.sender_id.toString() === currentUserId.toString();
            const stableKey = `${message.id || ''}:${message.sender_id}:${message.created_at}`;

            // Calculate swipe transform for this message
            const isBeingSwiped = message.id === swipingMessageId;
            const swipeStyle = isBeingSwiped
              ? { transform: `translateX(${swipeDistance}px)` }
              : {};

            // Add visual swipe indicator when swiping
            const showReplyIndicator = isBeingSwiped && swipeDistance > swipeThreshold / 2;

            return (
              <div key={stableKey} className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                {!isOwn && (
                  message.profile_picture ? (
                    <img
                      src={`${API_BASE_URL}${message.profile_picture}`}
                      alt={message.sender_name}
                      className="flex-shrink-0 w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex-shrink-0 w-9 h-9 pt-0.5 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center
                       text-violet-700 dark:text-violet-300 text-sm font-medium overflow-hidden">
                      {getInitials(message.sender_name)}
                    </div>
                  )
                )}

                <div
                  className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"} relative`}
                  onTouchStart={(e) => handleTouchStart(e, message.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  style={swipeStyle}
                >
                  {/* Sender name */}
                  {!isOwn && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">{message.sender_name}</span>
                  )}

                  {/* Reply indicator that shows when swiping */}
                  {showReplyIndicator && (
                    <div className={`absolute top-1/2 -translate-y-1/2 text-violet-500 dark:text-violet-400
                    ${isOwn
                        ? "right-0 translate-x-8" 
                        : "left-0 -translate-x-8"  
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" className="w-6 h-6" strokeWidth="2">
                        <polyline points={isOwn ? "15 14 20 9 15 4" : "9 14 4 9 4"} />
                        <path d={isOwn ? "M4 20v-7a4 4 0 0 1 4-4h12" : "M20 20v-7a4 4 0 0 0-4-4H4"} />
                      </svg>
                    </div>
                  )}
                  {/* Reply preview */}
                  {message.reply_to && message.replied_message && (
                    <ReplyPreview
                      senderName={message.replied_message.sender_name}
                      message={message.replied_message.message}
                      isOwn={currentUserId !== undefined &&
                        message.replied_message.id !== undefined &&
                        message.replied_message.id.toString() === currentUserId.toString()}
                      onClick={() => {
                        const repliedMessageElement = document.getElementById(`message-${message.reply_to}`);
                        if (repliedMessageElement) {
                          repliedMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          repliedMessageElement.classList.add('highlight-message');
                          setTimeout(() => repliedMessageElement.classList.remove('highlight-message'), 2000);
                        }
                      }}
                    />
                  )}

                  {/* Message bubble */}
                  <div className="group"> {/* Changed from "group relative" to just "group" */}
                    <div
                      id={`message-${message.id}`}
                      className={`px-3 py-2 rounded-lg ${isOwn
                        ? "bg-violet-200 dark:bg-violet-600 text-gray-800 dark:text-white"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        }`}
                    >
                      <MessageContent content={message.message} />
                    </div>

                    {/* NEW: Actions & timestamp row */}
                    <div className={`flex items-center gap-2 mt-1 ${isOwn ? "justify-end" : ""}`}>
                        {onReplyToMessage && (
                        <button
                          onClick={() => onReplyToMessage(message.id)}
                          className="cursor-pointer flex items-center text-xs text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 focus:outline-none"
                          aria-label="Reply to message"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" className="mr-1">
                          <path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                          </svg>
                          Reply
                        </button>
                        )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {isOwn && (
                  message.profile_picture ? (
                    <img
                      src={`${API_BASE_URL}${message.profile_picture}`}
                      alt="User Avatar"
                      className="flex-shrink-0 w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex-shrink-0 w-8 h-8 pt-0.5 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                      {getUserInitials()}
                    </div>
                  )
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