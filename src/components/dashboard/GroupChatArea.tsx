'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GroupMessageList } from './GroupMessageList';
import { GroupMessage, groupsAPI } from '@/lib/groupsApi';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ReplyingToPreview } from '@/components/chat/ReplyingToPreview';
import { GroupMessageSearchBar } from '@/components/chat/GroupMessageSearchBar';
import { Group } from '@/lib/groupsApi';
import { MessageContent } from '@/components/chat/MessageContent';
import toast, { Toaster } from 'react-hot-toast';
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
  
  // Pinned messages state
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<GroupMessage[]>([]);

  // Update pinned messages whenever messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      const pinned = messages.filter(message => message.is_pinned === 1);
      setPinnedMessages(pinned);
    } else {
      setPinnedMessages([]);
    }
  }, [messages]);

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

const handlePinMessage = async (messageId: number, pinStatus: number) => {
  try {
    // If trying to pin a message (pinStatus = 1) and we already have 10 pinned messages
    if (pinStatus === 1 && pinnedMessages.length >= 10) {
      toast.error(
        'You can have a maximum of 10 pinned messages. Please unpin some messages before pinning more.',
        {
          duration: 5000,
          icon: '📌',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }
      );
      return;
    }
    
    console.log(`Toggling pin status for message ${messageId} to ${pinStatus}`);
    await groupsAPI.pinGroupMessage(messageId, pinStatus);
    
    // Show success toast when pinning/unpinning is successful
    toast.success(
      pinStatus === 1 ? 'Message pinned successfully!' : 'Message unpinned successfully!',
      { 
        duration: 3000,
        icon: pinStatus === 1 ? '📌' : '✅',
      }
    );
    
    // Add a small delay to ensure backend has processed the update
    console.log('Pin status updated, waiting before refreshing...');
    setTimeout(() => {
      console.log('Now refreshing messages...');
      handleRetryLoadMessages();
    }, 500);
  } catch (error) {
    console.error('Failed to update pin status:', error);
    toast.error('Failed to update pin status', {
      duration: 4000,
      icon: '❌',
    });
  }
};

  return (
    <div className="flex-1 flex flex-col bg-violet-50 dark:bg-gray-950 overflow-hidden relative">
         <Toaster position="top-right" toastOptions={{
      // Default options for all toasts
      className: '',
      duration: 5000,
      style: {
        background: '#363636',
        color: '#fff',
      },
      // Customize based on toast type
      success: {
        duration: 3000,
        style: {
          background: 'rgba(72, 187, 120, 0.9)',
        },
      },
      error: {
        duration: 5000,
        style: {
          background: 'rgba(239, 68, 68, 0.9)',
        },
      },
    }} />
     
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

      {/* Pinned Messages Section */}
      {pinnedMessages.length > 0 && (
        <div className="border-b border-violet-100 dark:border-gray-800">
          <div className="px-4 py-2 bg-violet-100/50 dark:bg-violet-900/20 flex items-center justify-between cursor-pointer"
               onClick={() => setShowPinnedMessages(!showPinnedMessages)}>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 44.16 43.67" className="text-yellow-500 dark:text-yellow-400">
                <g>
                  <g>
                    <path fill="currentColor" d="M17.25 24.35 0 43.67l19.43-17.15-2.18-2.17z"></path>
                    <path fill="currentColor" d="M8.57 15.73 19.6 26.86l8.3 8.48-1.32-7.47 11.26-13.96 6.32.36L30.2 0v5.43L16.9 17.66l-8.33-1.93z"></path>
                  </g>
                </g>
              </svg>
              <span className="font-medium text-sm">Pinned Messages ({pinnedMessages.length})</span>
            </div>
            <svg 
              className={`h-5 w-5 text-gray-500 transform transition-transform ${showPinnedMessages ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {showPinnedMessages && (
            <div className="max-h-64 overflow-y-auto p-2 bg-violet-50/50 dark:bg-gray-900/50">
              {pinnedMessages.map(message => (
                <div 
                  key={message.id} 
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 mb-2 shadow-sm hover:shadow transition-shadow cursor-pointer border-l-4 border-yellow-400"
                  onClick={() => scrollToMessage(message.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{message.sender_name}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinMessage(message.id, 0);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center"
                      title="Unpin message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" className="mr-1" viewBox="0 0 44.16 43.67">
                        <g>
                          <g>
                            <path fill="currentColor" d="M17.25 24.35 0 43.67l19.43-17.15-2.18-2.17z"></path>
                            <path fill="currentColor" d="M8.57 15.73 19.6 26.86l8.3 8.48-1.32-7.47 11.26-13.96 6.32.36L30.2 0v5.43L16.9 17.66l-8.33-1.93z"></path>
                            <line x1="0" y1="10" x2="30" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </g>
                        </g>
                      </svg>
                      Unpin
                    </button>
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                    <MessageContent content={message.message} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              onPinMessage={handlePinMessage}
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