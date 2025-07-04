'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { GroupMember } from '@/lib/groupsApi';
import { API_BASE_URL } from '@/lib/api';

// Update the interface to include currentUserId prop
interface MentionInputProps {
  onSendMessage: (message: string, file?: File) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
  groupId?: number | null;
  currentUserId?: number | string; // Add this prop
}

export const MentionInput: React.FC<MentionInputProps> = ({ 
  onSendMessage, 
  onTypingChange,
  disabled = false,
  groupId,
  currentUserId: propCurrentUserId // Accept the prop
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // For mentions functionality
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([]);
  const mentionsRef = useRef<HTMLDivElement>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(
    propCurrentUserId ? Number(propCurrentUserId) : null
  );

  // Set current user ID from props if provided
  useEffect(() => {
    if (propCurrentUserId) {
      console.log("Using currentUserId from props:", propCurrentUserId);
      setCurrentUserId(Number(propCurrentUserId));
    } else {
      console.log("No currentUserId provided via props, trying localStorage");
      try {
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
          const user = JSON.parse(userSession);
          if (user && user.user_id) {
            console.log("Setting currentUserId from localStorage:", user.user_id);
            setCurrentUserId(Number(user.user_id));
          }
        }
      } catch (error) {
        console.error("Error getting user from localStorage:", error);
      }
    }
  }, [propCurrentUserId]);

  // Fetch group members when groupId changes
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!groupId) {
        setGroupMembers([]);
        return;
      }

      setLoading(true);
      try {
        const { groupsAPI } = await import('@/lib/groupsApi');
        const members = await groupsAPI.getGroupMembers(groupId);
        console.log("Fetched group members:", members);
        setGroupMembers(members);
      } catch (error) {
        console.error("Error fetching group members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupMembers();
  }, [groupId]);

  // Update filtered members when mentionSearch changes
  useEffect(() => {
    if (showMentions && groupMembers.length > 0) {
      console.log("Filtering members with search:", mentionSearch);
      console.log("Current user ID for filtering:", currentUserId);
      
      // Filter by search term AND exclude current user
      const filtered = groupMembers.filter(member => {
        const nameMatches = member.name.toLowerCase().includes(mentionSearch.toLowerCase());
        const notCurrentUser = currentUserId === null || member.user_id !== currentUserId;
        
        console.log(`Member ${member.name} (${member.user_id}): nameMatches=${nameMatches}, notCurrentUser=${notCurrentUser}`);
        
        return nameMatches && notCurrentUser;
      });
      
      console.log("Filtered members (excluding current user):", filtered);
      setFilteredMembers(filtered);
      setSelectedMentionIndex(0);
    }
  }, [mentionSearch, showMentions, groupMembers, currentUserId]);

  // Handle click outside the mentions dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionsRef.current && !mentionsRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowMentions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if ((!message.trim() && !selectedFile) || disabled || isUploading) return;
    
    setIsUploading(true);
    
    try {
      onSendMessage(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
    
    if (onTypingChange && isTyping) {
      setIsTyping(false);
      onTypingChange(false);
    }
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle mentions
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);
    
    // Check if we should show mentions dropdown
    const lastAtSymbolPos = value.lastIndexOf('@', cursorPos - 1);
    if (lastAtSymbolPos !== -1) {
      const textAfterAt = value.substring(lastAtSymbolPos + 1, cursorPos);
      console.log("@ detected, text after @:", textAfterAt);
      // Check if there's a space between the last @ and current position
      if (!textAfterAt.includes(' ') && cursorPos - lastAtSymbolPos <= 20) {
        console.log("Showing mentions dropdown");
        setShowMentions(true);
        setMentionSearch(textAfterAt);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
    
    if (onTypingChange) {
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        onTypingChange(true);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTypingChange(false);
        }
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredMembers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Insert mention at cursor position
  const insertMention = useCallback((member: GroupMember) => {
    if (!inputRef.current) return;
    
    const beforeCursor = message.substring(0, cursorPosition);
    const lastAtSymbolPos = beforeCursor.lastIndexOf('@');
    
    if (lastAtSymbolPos !== -1) {
      const beforeMention = message.substring(0, lastAtSymbolPos);
      const afterCursor = message.substring(cursorPosition);
      
      // Format: @[Name:id]
      const mentionText = `@[${member.name}:${member.user_id}] `;
      const newMessage = beforeMention + mentionText + afterCursor;
      
      setMessage(newMessage);
      setShowMentions(false);
      
      // Set cursor position after the inserted mention
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = beforeMention.length + mentionText.length;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  }, [message, cursorPosition]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      
      if (e.target.files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    }
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Helper function to get initials for avatars
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="h-auto min-h-[80px] shrink-0 bg-white dark:bg-gray-900 border-t border-l border-violet-100 dark:border-gray-800 p-4">
      {selectedFile && (
        <div className="mb-2 p-2 bg-violet-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            {previewUrl && selectedFile.type.startsWith('image/') ? (
              <div className="flex items-center">
                <div className="w-12 h-12 relative mr-3 flex-shrink-0 rounded-md overflow-hidden border border-violet-200 dark:border-violet-900">
                  <img 
                    src={previewUrl}
                    alt="Image preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm truncate">{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <div className="w-6 h-6 flex-shrink-0 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-violet-600 dark:text-violet-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <span className="text-sm truncate">{selectedFile.name}</span>
              </>
            )}
          </div>
          <button 
            onClick={removeSelectedFile}
            className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
            aria-label="Remove file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <button 
          onClick={handleAttachmentClick}
          disabled={disabled || isUploading}
          className={cn(
            "p-2 rounded-full", 
            disabled || isUploading
              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
              : "text-black dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-gray-800"
          )}
          aria-label="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? "Add a comment or send without text" : "Type a message..."}
            className="w-full py-3 px-4 bg-violet-50 dark:bg-gray-800 rounded-full border-0 focus:ring-2 focus:ring-violet-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            disabled={disabled || isUploading}
            autoComplete="off"
          />
          
          {/* Mentions dropdown */}
          {showMentions && (
            <div 
              ref={mentionsRef}
              className="absolute bottom-full left-0 mb-1 w-64 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
            >
              {loading ? (
                <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                  Loading members...
                </div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member, index) => (
                  <div
                    key={member.user_id}
                    className={cn(
                      "px-3 py-2 cursor-pointer flex items-center",
                      index === selectedMentionIndex
                        ? "bg-violet-100 dark:bg-violet-900/40" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                    onClick={() => insertMention(member)}
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-200 dark:bg-violet-900 flex-shrink-0 flex items-center justify-center text-violet-700 dark:text-violet-300 text-sm font-medium">
                      {member.profile_picture ? (
                        <img 
                          src={`${API_BASE_URL}${member.profile_picture}`}
                          alt={member.name} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(member.name)
                      )}
                    </div>
                    <span className="ml-2 text-gray-800 dark:text-gray-200">
                      {member.name}
                    </span>
                    {member.role === 'admin' && (
                      <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                  No members match your search
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={(!message.trim() && !selectedFile) || disabled || isUploading}
          className={cn(
            "p-3 rounded-full text-white",
            (!message.trim() && !selectedFile) || disabled || isUploading
              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-700"
          )}
          aria-label="Send message"
        >
          {isUploading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};