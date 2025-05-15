'use client';

import React, { useState, useRef, memo, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput = memo(function MessageInput({ 
  onSendMessage, 
  onTypingChange,
  disabled = false 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    
    onSendMessage(message);
    setMessage('');
    
    // Clear typing indicator when sending a message
    if (onTypingChange && isTyping) {
      setIsTyping(false);
      onTypingChange(false);
    }
    
    // Keep focus on input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicator
    if (onTypingChange) {
      // If user wasn't typing before, trigger typing start
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        onTypingChange(true);
      }
      
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTypingChange(false);
        }
      }, 2000);
    }
  };
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-[80px] shrink-0 bg-white dark:bg-gray-900 border-t border-violet-100 dark:border-gray-800 p-4">
      <div className="flex items-center space-x-2">
        <button className="p-2 text-black dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-gray-800 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type a message"
            className="w-full py-3 px-4 bg-violet-50 dark:bg-gray-800 rounded-full border-0 focus:ring-2 focus:ring-violet-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            disabled={disabled}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className={cn(
            "p-3 rounded-full text-white",
            message.trim() && !disabled
              ? "bg-violet-600 hover:bg-violet-700"
              : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
});
