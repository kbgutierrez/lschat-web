'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MessageList } from './MessageList';
import { Message } from './MessageItem';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ReplyingToPreview } from '@/components/chat/ReplyingToPreview';
import { MessageSearchBar } from '@/components/chat/MessageSearchBar';

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
  onReplyToMessage?: (messageId: string) => void;
  currentUserId?: string | number;
  replyingToMessage?: {
    id: string;
    text: string;
    isOwn: boolean;
  } | null;
  onCancelReply?: () => void;
}

interface SearchResult {
  messageId: string;
  text: string;
  index: number;
  isOwn: boolean;
  senderName?: string;
  timestamp?: string;
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
  isPending = false,
  onReplyToMessage,
  currentUserId,
  replyingToMessage,
  onCancelReply,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessagesLengthRef = useRef<number>(0);
  
  // Search states
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [lastScrollTop, setLastScrollTop] = useState(0);

  // Scroll detection for search bar
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    const scrollingUp = scrollTop < lastScrollTop;
    
    setLastScrollTop(scrollTop);

    // Show search bar when scrolling up and not near bottom, and there are enough messages
    if (scrollingUp && !isNearBottom && messages.length > 10 && !showSearchBar) {
      setShowSearchBar(true);
    }
    // Hide search bar when near bottom
    else if (isNearBottom && showSearchBar && !currentSearchQuery) {
      setShowSearchBar(false);
    }
  }, [lastScrollTop, messages.length, showSearchBar, currentSearchQuery]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Search functionality
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setCurrentSearchQuery('');
      return;
    }

    setIsSearching(true);
    setCurrentSearchQuery(query);

    // Simulate search delay for better UX
    const searchTimeout = setTimeout(() => {
      const results: SearchResult[] = [];
      const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

      messages.forEach((message, index) => {
        if (searchRegex.test(message.text)) {
          results.push({
            messageId: message.id,
            text: message.text,
            index,
            isOwn: message.isOwn,
            senderName: message.isOwn ? 'You' : contactName,
            timestamp: message.time
          });
        }
      });

      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);
      setIsSearching(false);

      // Auto-scroll to first result
      if (results.length > 0) {
        scrollToMessage(results[0].messageId);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [messages, contactName]);

  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement && containerRef.current) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the message temporarily
      messageElement.classList.add('search-highlight');
      setTimeout(() => {
        messageElement.classList.remove('search-highlight');
      }, 2000);
    }
  }, []);

  const navigateSearchResult = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }

    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex].messageId);
  }, [searchResults, currentSearchIndex, scrollToMessage]);

  const handleCloseSearch = useCallback(() => {
    setShowSearchBar(false);
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setCurrentSearchQuery('');
    setIsSearching(false);
  }, []);

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
    <div className="flex-1 flex flex-col bg-violet-50 dark:bg-gray-950 overflow-hidden relative">
      {/* Search Bar */}
      <MessageSearchBar
        isVisible={showSearchBar}
        onClose={handleCloseSearch}
        onSearchResultSelect={scrollToMessage}
        searchResults={searchResults}
        onSearch={performSearch}
        currentResultIndex={currentSearchIndex}
        onNavigateResult={navigateSearchResult}
        isSearching={isSearching}
      />

      <div 
        ref={containerRef}
        className="chat-messages-container flex-1 overflow-y-auto no-scrollbar"
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
              onReplyToMessage={onReplyToMessage}
              currentUserId={currentUserId}
              searchQuery={currentSearchQuery}
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

      <div className="mt-auto">
        {replyingToMessage && (
          <ReplyingToPreview
            senderName={replyingToMessage.isOwn ? 'You' : contactName}
            message={replyingToMessage.text}
            onCancel={onCancelReply || (() => { })}
          />
        )}

        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingChange={handleTyping}
          disabled={!selectedChannel || isPending}
        />
      </div>
    </div>
  );
}

export const MemoizedChatArea = React.memo(ChatArea);
