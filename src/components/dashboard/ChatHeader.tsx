'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User } from '@/lib/clientUtils';
import { getInitials } from '@/utils/initials';
import { Group } from '@/lib/groupsApi';

type ContactDetails = {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
  unread: number;
};

interface ChatHeaderProps {
  user: User;
  contactDetails: ContactDetails | null;
  groupDetails: Group | null;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onOpenProfileModal: () => void;
  onToggleRightPanel: () => void; // Add this prop
  channelId?: string | null;
  pubnubConnected?: boolean;
  lastMessage?: any;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  user, 
  contactDetails,
  groupDetails,
  onToggleSidebar, 
  onLogout,
  onOpenProfileModal,
  onToggleRightPanel, // Add this prop
  channelId,
  pubnubConnected,
  lastMessage
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Handle clicks outside the menu
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        showUserMenu &&
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showUserMenu]);

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-violet-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
      {/* Left side - Contact/Group info */}
      <div className="flex items-center space-x-3">
        <button 
          className="md:hidden p-2 rounded-md hover:bg-violet-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          onClick={onToggleSidebar}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {contactDetails ? (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-lg font-bold">
                {getInitials(contactDetails.name)}
              </div>
              <div className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900",
                contactDetails.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              )}></div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{contactDetails.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {contactDetails.status === 'online' 
                  ? 'Online now' 
                  : `Last seen ${contactDetails.lastSeen}`}
              </p>
            </div>
          </div>
        ) : groupDetails ? (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
                {getInitials(groupDetails.name)}
              </div>
              {/* Removed the misleading online status indicator for groups */}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                {groupDetails.name}
                {groupDetails.role === 'admin' && (
                  <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Admin</span>
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {groupDetails.description || 'Group Chat'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-gray-800"></div>
            <div>
              <div className="h-4 w-24 bg-violet-100 dark:bg-gray-800 rounded"></div>
              <div className="h-3 w-16 bg-violet-50 dark:bg-gray-700 rounded mt-1"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Right side - Actions and user profile */}
      <div className="flex items-center">
        {/* Show toggle button only on mobile */}
        {(contactDetails || groupDetails) && (
          <button
            onClick={onToggleRightPanel}
            className="p-2 rounded-full text-gray-500 hover:bg-violet-50 dark:hover:bg-gray-800 mr-1 md:hidden"
            aria-label="Show info"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
        
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={toggleUserMenu}
            className="flex items-center hover:cursor-pointer space-x-2 p-1.5 rounded-full hover:bg-violet-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {/* Update user avatar to match contact avatar style */}
            <div className="w-9 h-9 pt-0.5 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-sm font-medium">
              {getInitials(user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.username || 'User')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.username || 'User'}
              </p>
              {(user.username || user.email) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {user.email || user.username}
                </p>
              )}
            </div>
            <svg className="w-4 h-4  text-gray-500 dark:text-gray-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showUserMenu && (
            <div 
              ref={menuRef}
              className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 py-1 z-10"
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username || 'User'}
                </p>
                {(user.username || user.email) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email || user.username}
                  </p>
                )}
              </div>
                <button 
                className='w-full text-left hover:cursor-pointer px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center'
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenProfileModal(); // Use modal instead of navigation
                }}
                >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Management
                </button>
              <button className='w-full text-left hover:cursor-pointer px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center'>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>                
                Account Manager
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left hover:cursor-pointer px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
