'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User } from '@/lib/clientUtils';
import { getInitials } from './ContactItem'; 

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
  onToggleSidebar: () => void;
  onLogout: () => void;
  channelId?: string | null;
  pubnubConnected?: boolean;
  lastMessage?: any;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  user, 
  contactDetails, 
  onToggleSidebar, 
  onLogout,
  channelId,
  pubnubConnected,
  lastMessage
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-violet-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
      {/* Left side - Contact info */}
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
      
      {/* Right side - User profile */}
      <div className="flex items-center">
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-violet-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {/* Update user avatar to match contact avatar style */}
            <div className="w-8 h-8 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-sm font-medium">
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
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 py-1 z-10">
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
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
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
