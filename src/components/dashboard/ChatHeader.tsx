'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User } from '@/lib/clientUtils';
import { getInitials } from '@/utils/initials';
import { Group } from '@/lib/groupsApi';
import { useIsClient } from '@/lib/clientUtils';
import { API_BASE_URL, contactsAPI } from '@/lib/api';

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
  onToggleRightPanel: () => void;
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
  onToggleRightPanel,
  channelId,
  pubnubConnected,
  lastMessage
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRequestsMenu, setShowRequestsMenu] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const requestsMenuRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const isClient = useIsClient();

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  const fetchIncomingRequests = async () => {
    if (!isClient || !user?.user_id) return;
    setLoadingRequests(true);
    setRequestsError(null);
    try {
      const data = await contactsAPI.fetchIncomingRequests(user.user_id);
      setIncomingRequests(data);
    } catch (e: any) {
      setRequestsError(e?.message || 'Failed to fetch requests');
      setIncomingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      fetchIncomingRequests();
    }
  }, [user?.user_id, isClient]);

  useEffect(() => {
    if (!user?.user_id) return;
    const interval = setInterval(() => {
      fetchIncomingRequests();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.user_id, isClient]);

  useEffect(() => {
    if (showRequestsMenu) fetchIncomingRequests();
  }, [showRequestsMenu, isClient, user?.user_id]);

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
      if (
        showRequestsMenu &&
        requestsMenuRef.current &&
        bellButtonRef.current &&
        !requestsMenuRef.current.contains(event.target as Node) &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setShowRequestsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showUserMenu, showRequestsMenu]);

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-violet-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
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
      
      <div className="flex items-center">
        {/* Contact Requests Bell Icon */}
        <div className="relative mr-2">
          <button
            ref={bellButtonRef}
            onClick={() => setShowRequestsMenu((v) => !v)}
            className={cn(
              "p-2 rounded-full hover:bg-violet-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500",
              incomingRequests.length > 0 ? "text-gray-500" : "text-gray-500"
            )}
            aria-label="Incoming contact requests"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {incomingRequests.length}
              </span>
            )}
          </button>
          {showRequestsMenu && (
            <div
              ref={requestsMenuRef}
              className="absolute right-0 top-full w-80 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 py-1 z-20"
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <span className="font-medium text-gray-800 dark:text-gray-200">Notifications</span>
                {loadingRequests && (
                  <svg className="ml-2 animate-spin h-4 w-4 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
              {requestsError && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400">{requestsError}</div>
              )}
              {!loadingRequests && incomingRequests.length === 0 && !requestsError && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No notifications
                </div>
              )}
              {incomingRequests.length > 0 && (
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {incomingRequests.map((req) => (
                    <div key={req.user_id} className="flex items-center px-4 py-3">
                      <div className="w-10 h-10 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-base font-bold mr-3">
                        {getInitials(req.requester_full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{req.requester_full_name}</div>
                      
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          className="px-2 py-1 text-xs rounded bg-green-500/80 text-white opacity-60 cursor-not-allowed"
                          disabled
                          title="Accept (not implemented)"
                        >
                          Accept
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded bg-red-500/80 text-white opacity-60 cursor-not-allowed"
                          disabled
                          title="Reject (not implemented)"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center">
          {(contactDetails || groupDetails) && (
            <button
              onClick={onToggleRightPanel}
              className="p-2 rounded-full text-gray-500 hover:bg-violet-50 dark:hover:bg-gray-800 mr-1 md:hidden"
              aria-label="Show info"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleUserMenu}
              className="flex items-center hover:cursor-pointer space-x-2 p-1.5 rounded-full hover:bg-violet-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
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
                    onOpenProfileModal();
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
      </div>
    </header>
  );
};
