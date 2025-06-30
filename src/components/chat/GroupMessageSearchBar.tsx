'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GroupMessage } from '@/lib/groupsApi';

interface GroupSearchResult {
  messageId: number;
  text: string;
  index: number;
  senderName: string;
  senderId: number;
  timestamp: string;
}

interface GroupMessageSearchBarProps {
  isVisible: boolean;
  onClose: () => void;
  onSearchResultSelect: (messageId: number) => void;
  searchResults: GroupSearchResult[];
  onSearch: (query: string) => void;
  currentResultIndex: number;
  onNavigateResult: (direction: 'next' | 'prev') => void;
  isSearching: boolean;
}

export const GroupMessageSearchBar: React.FC<GroupMessageSearchBarProps> = ({
  isVisible,
  onClose,
  onSearchResultSelect,
  searchResults,
  onSearch,
  currentResultIndex,
  onNavigateResult,
  isSearching
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          onNavigateResult('prev');
        } else {
          onNavigateResult('next');
        }
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        onNavigateResult('prev');
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        onNavigateResult('next');
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose, onNavigateResult]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-violet-200 dark:border-gray-700 shadow-md z-10 animate-slide-in-down">
      <div className="flex items-center px-4 py-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search group messages..."
              className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Results Counter */}
        {searchQuery && (
          <div className="mx-4 flex items-center space-x-2">
            {isSearching ? (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </div>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[80px] text-center">
                {searchResults.length > 0 
                  ? `${currentResultIndex + 1} of ${searchResults.length}`
                  : 'No results'
                }
              </span>
            )}

            {/* Navigation Buttons */}
            {searchResults.length > 0 && (
              <div className="flex space-x-1">
                <button
                  onClick={() => onNavigateResult('prev')}
                  disabled={currentResultIndex === 0}
                  className={cn(
                    "p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                    currentResultIndex === 0 && "opacity-50 cursor-not-allowed"
                  )}
                  title="Previous result (Shift+Enter or ↑)"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => onNavigateResult('next')}
                  disabled={currentResultIndex === searchResults.length - 1}
                  className={cn(
                    "p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                    currentResultIndex === searchResults.length - 1 && "opacity-50 cursor-not-allowed"
                  )}
                  title="Next result (Enter or ↓)"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Close search (Esc)"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};