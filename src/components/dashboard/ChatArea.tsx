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
  handleSendMessage: (message: string) => void;
  handleTyping?: (isTyping: boolean) => void;
  selectedChannel: string | null;
  isTyping?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
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
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ensure scroll to bottom when messages change
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scroll to bottom immediately
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    
    // Secondary scroll after all renders and images are loaded
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 10);
    
    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-violet-50 dark:bg-gray-950 overflow-hidden">
      <div 
        ref={containerRef}
        className="chat-messages-container flex-1 overflow-y-auto" 
        style={{ 
          height: "calc(100% - 80px)", 
          display: "flex",
          flexDirection: "column",
          scrollBehavior: "auto" // Use instant scrolling
        }}
      >
        <div className="p-4 space-y-3 flex-1"> {/* Removed max-width and width classes */}
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
