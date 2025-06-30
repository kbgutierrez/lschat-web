'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GroupMessageList } from './GroupMessageList';
import { GroupMessage } from '@/lib/groupsApi';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ReplyingToPreview } from '@/components/chat/ReplyingToPreview';
import { GroupMessageSearchBar } from '@/components/chat/GroupMessageSearchBar';
import { Group } from '@/lib/groupsApi';

interface GroupChatAreaProps {
  selectedGroup: number;
  groupDetails: Group | null; 
  messages: GroupMessage[];
  loadingMessages: boolean;
  messageError: string | null;
  handleRetryLoadMessages: () => void;
  handleSendMessage: (message: string, file?: File) => void;
  handleTyping?: (isTyping: boolean) => void;
  isTyping?: boolean;
  typingSenderId?: number;
  typingSenderName?: string;
  onReplyToMessage?: (messageId: number) => void;
  currentUserId?: string | number;
  replyingToMessage?: GroupMessage | null;
  onCancelReply?: () => void;
}

interface GroupSearchResult {
  messageId: number;
  text: string;
  index: number;
  senderName: string;
  senderId: number;
  timestamp: string;
}

export function GroupChatArea({
  selectedGroup,
  groupDetails,
  messages,
  loadingMessages,
  messageError,
  handleRetryLoadMessages,
  handleSendMessage,
  handleTyping,
  isTyping = false,
  typingSenderId,
  typingSenderName,
  onReplyToMessage,
  currentUserId,
  replyingToMessage,
  onCancelReply,
}: GroupChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessagesLengthRef = useRef<number>(0);

  // Search states
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchResults, setSearchResults] = useState<GroupSearchResult[]>([]);
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
      const results: GroupSearchResult[] = [];
      const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

      messages.forEach((message, index) => {
        if (searchRegex.test(message.message)) {
          results.push({
            messageId: message.id,
            text: message.message,
            index,
            senderName: message.sender_name,
            senderId: message.sender_id,
            timestamp: message.created_at
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
  }, [messages]);

  const scrollToMessage = useCallback((messageId: number) => {
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
      <GroupMessageSearchBar
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
              <span className="text-xs text-black dark:text-gray-400">
                {groupDetails?.name || 'Group Chat'}
              </span>
            </div>
          </div>

          <div className="relative min-h-[200px]">
            <GroupMessageList
              messages={messages}
              groupName={groupDetails?.name || 'Group Chat'}
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

      {isTyping && typingSenderName && (
        <TypingIndicator
          isTyping={isTyping}
          contactName={typingSenderName}
          className="mx-3 mb-1"
        />
      )}

      <div className="mt-auto">
        {replyingToMessage && (
          <ReplyingToPreview
            senderName={replyingToMessage.sender_name}
            message={replyingToMessage.message}
            onCancel={onCancelReply || (() => { })}
          />
        )}

        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingChange={handleTyping}
          disabled={!selectedGroup}
        />
      </div>
    </div>
  );
}

export const MemoizedGroupChatArea = React.memo(GroupChatArea);