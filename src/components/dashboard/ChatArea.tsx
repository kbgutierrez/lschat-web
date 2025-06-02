'use client';

import React, { useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { Message } from './MessageItem';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

interface ChatAreaProps {
  selectedContact: string;
  contactName: string;
  contactPicture?: string; 
  messages: Message[];
  loadingMessages: boolean;
  messageError: string | null;
  handleRetryLoadMessages: () => void;
  handleSendMessage: (message: string, file?: File) => void;
  handleTyping: (isTyping: boolean) => void;
  selectedChannel: string | null;
  isTyping: boolean;
  isPending?: boolean; 
}

export function ChatArea({
  selectedContact,
  contactName,
  contactPicture,
  messages,
  loadingMessages,
  messageError,
  handleRetryLoadMessages,
  handleSendMessage,
  handleTyping,
  selectedChannel,
  isTyping,
  isPending = false 
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessagesLengthRef = useRef<number>(0);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const shouldScrollToBottom = () => {
      if (!containerRef.current) return true;
      
      const container = containerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPosition = scrollTop + clientHeight;
      
      return (
        scrollHeight - scrollPosition < 100 || 
        messages.length > lastMessagesLengthRef.current
      );
    };
    
    lastMessagesLengthRef.current = messages.length;
    
    if (shouldScrollToBottom()) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-violet-50 dark:bg-gray-950 overflow-hidden">
      <div className="chat-messages-container flex-1 overflow-y-auto no-scrollbar" 
        style={{ 
          height: "calc(100% - 80px)", 
          display: "flex",
          flexDirection: "column",
          scrollBehavior: "smooth"
        }}
      >
        <div className="p-4 space-y-3 flex-1"> 
          <div className="flex justify-center my-4">
            <div className="px-3 py-1 bg-violet-100 dark:bg-gray-800 rounded-full">
              <span className="text-xs text-black dark:text-gray-400">Today</span>
            </div>
          </div>

          {isPending && (
            <div className="flex justify-center my-4">
              <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center max-w-md">
                <div className="flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Contact Request Pending</h3>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  You cannot exchange messages yet. Messaging will be available once this contact accepts your request.
                </p>
              </div>
            </div>
          )}
          
          <div className="relative min-h-[200px]">
            <MessageList 
              messages={messages}
              contactName={contactName}
              contactPicture={contactPicture}
              isLoading={loadingMessages}
              error={messageError}
              onRetry={handleRetryLoadMessages}
              endRef={messagesEndRef}
            />
          </div>
          
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {isTyping && selectedChannel && !isPending && (
        <TypingIndicator 
          isTyping={isTyping} 
          contactName={contactName}
          className="mx-3 mb-1"
        />
      )}

      <MessageInput 
        onSendMessage={handleSendMessage}
        onTypingChange={handleTyping}
        disabled={!selectedChannel || isPending} // Disable input if pending
      />
    </div>
  );
}

export const MemoizedChatArea = React.memo(ChatArea);
