'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MessageContent } from '@/components/chat/MessageContent';
import { getInitials } from './ContactItem';
import { ReplyPreview } from '@/components/chat/ReplyPreview';

export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
  type: string;
  isRead: boolean;
  reply_to?: string; 
  replied_message?: {
    id: string;
    sender_name: string;
    message: string;
  };
}

interface MessageItemProps {
  message: Message;
  contactName: string;
  showAvatar: boolean;
  isConsecutive: boolean;
  contactPicture?: string;
  onReplyToMessage?: (messageId: string) => void; 
    currentUserId?: string | number;
}

export function MessageItem({ 
  message, 
  contactName, 
  contactPicture, 
  showAvatar, 
  isConsecutive,
  onReplyToMessage,
  currentUserId
}: MessageItemProps) {
  const { id, text, time, isOwn, reply_to, replied_message } = message;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  return (
    <div className={cn(
      "flex gap-2",
      isOwn ? "justify-end" : "justify-start",
    )}>
      {!isOwn && showAvatar && (
        contactPicture ? (
          <img
            src={`${API_BASE_URL}${contactPicture}`}
            alt={contactName}
            className="flex-shrink-0 w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex-shrink-0 w-9 h-9 pt-0.5 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center
             text-violet-700 dark:text-violet-300 text-sm font-medium overflow-hidden">
            {getInitials(contactName)}
          </div>
        )
      )}

      <div className={cn(
        "max-w-[75%] flex flex-col", 
        isOwn ? "items-end" : "items-start"
      )}>
        {!isOwn && !isConsecutive && (
          <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">{contactName}</span>
        )}

        {/* Reply preview if this message is a reply */}
        {reply_to && replied_message && (
          <ReplyPreview
            senderName={replied_message.sender_name}
            message={replied_message.message}
            isOwn={currentUserId !== undefined && 
              replied_message.id !== undefined &&
              replied_message.id.toString() === currentUserId.toString()}
            onClick={() => {
              const element = document.getElementById(`message-${replied_message.id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-message');
                setTimeout(() => element.classList.remove('highlight-message'), 2000);
              }
            }}
          />
        )}

        {/* Message bubble */}
        <div className="group">
          <div
            id={`message-${id}`}
            className={cn(
              "px-3 py-2 rounded-lg", 
              isOwn 
                ? "bg-violet-200 dark:bg-violet-600 text-gray-800 dark:text-white" 
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            )}
          >
            <MessageContent content={text} />
          </div>

          {/* Actions & timestamp row */}
          <div className={`flex items-center gap-2 mt-1 ${isOwn ? "justify-end" : ""}`}>
            {onReplyToMessage && (
              <button
                onClick={() => onReplyToMessage(id)}
                className="flex items-center text-xs text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                aria-label="Reply to message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" className="mr-1">
                  <path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                </svg>
                Reply
              </button>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">{time}</span>
          </div>
        </div>
      </div>

      {isOwn && showAvatar && (
        contactPicture ? (
          <img
            src={`${API_BASE_URL}${contactPicture}`}
            alt="User Avatar"
            className="flex-shrink-0 w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex-shrink-0 w-8 h-8 pt-0.5 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
            {getInitials(contactName)}
          </div>
        )
      )}
    </div>
  );
}