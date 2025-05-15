'use client';

import React, { useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { Message } from './MessageItem';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

interface ChatAreaProps {
  selectedContact: string | null;
  contactName: string;
  messages: Message[];
  loadingMessages: boolean;
  messageError: string | null;
  handleRetryLoadMessages: () => void;
  handleSendMessage: (message: string, file?: File) => void;
  handleTyping?: (isTyping: boolean) => void;
  selectedChannel: string | null;
  isTyping?: boolean;
}

// Fix the component definition to avoid the "Component is not a function" error
export function ChatArea({
  selectedContact,
  contactName,
  messages,
  loadingMessages,
  messageError,
  handleRetryLoadMessages,
  handleSendMessage,
  handleTyping,
  selectedChannel,
  isTyping = false,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessagesLengthRef = useRef<number>(0);
  
  // Ensure scroll to bottom when messages change, but only if needed
  useEffect(() => {
    if (!containerRef.current) return;
    
    const shouldScrollToBottom = () => {
      if (!containerRef.current) return true;
      
      const container = containerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPosition = scrollTop + clientHeight;
      
      // If we're already near bottom or have new messages, scroll to bottom
      return (
        scrollHeight - scrollPosition < 100 || 
        messages.length > lastMessagesLengthRef.current
      );
    };
    
    // Store current message count to detect new messages
    lastMessagesLengthRef.current = messages.length;
    
    if (shouldScrollToBottom()) {
      // Scroll to bottom immediately
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      
      // Secondary scroll after all renders and images are loaded
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
      <div 
        ref={containerRef}
        className="chat-messages-container flex-1 overflow-y-auto no-scrollbar" 
        style={{ 
          height: "calc(100% - 80px)", 
          display: "flex",
          flexDirection: "column",
          scrollBehavior: "auto" // Use instant scrolling
        }}
      >
        <div className="p-4 space-y-3 flex-1"> 
          <div className="flex justify-center my-4">
            <div className="px-3 py-1 bg-violet-100 dark:bg-gray-800 rounded-full">
              <span className="text-xs text-black dark:text-gray-400">Today</span>
            </div>
          </div>

          <div className="relative min-h-[200px]">
            <MessageList 
              messages={messages}
              contactName={contactName}
              isLoading={loadingMessages}
              error={messageError}
              onRetry={handleRetryLoadMessages}
              endRef={messagesEndRef}
            />
          </div>
          
          <TypingIndicator 
            isTyping={isTyping}
            contactName={contactName}
            className="px-2 py-1 my-2"
          />
          
          {/* Important: This is the scroll target */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        onTypingChange={handleTyping}
        disabled={!selectedChannel}
      />
    </div>
  );
}

// Create a memoized version separately if needed
export const MemoizedChatArea = React.memo(ChatArea);
