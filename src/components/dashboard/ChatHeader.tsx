'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from './ContactItem';
import { contactsAPI } from '@/lib/api';
import { useIsClient } from '@/lib/clientUtils';

interface ConfirmingAction {
  id: string;
  action: 'accept' | 'reject';
}

type ContactDetails = {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
  unread: number;
  profilePicture?: string;
  contactPicture?: string;
};
interface User {
  user_id?: string | number;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  profilePicture?: string;
}

interface Group {
  group_id: number;
  name: string;
  description?: string;
  role?: string;
  pubnub_channel?: string;
}

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
  const [pendingActions, setPendingActions] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<{id: string, action: string} | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<ConfirmingAction | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const requestsMenuRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const isClient = useIsClient();
  const fetchErrorCountRef = useRef<number>(0);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(user?.profilePicture);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const fetchIncomingRequests = async (showLoading = true) => {
    if (!isClient || !user?.user_id) return;
    
    if (showLoading) {
      setLoadingRequests(true);
    }
    
    setRequestsError(null);
    
    try {
      const data = await contactsAPI.fetchIncomingRequests(user.user_id);
      setIncomingRequests(data);
      fetchErrorCountRef.current = 0;
    } catch (e: any) {
      setRequestsError(e?.message || 'Failed to fetch requests');
      setIncomingRequests([]);
      fetchErrorCountRef.current += 1;
    } finally {
      if (showLoading) {
        setLoadingRequests(false);
      }
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
      fetchIncomingRequests(false);
    }, 10000);
    
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

  const handleRequestAction = (requesterId: string, action: 'accept' | 'reject') => {
    setConfirmingAction({ id: requesterId, action });
  };

  const confirmAction = async () => {
    if (!confirmingAction || !user?.user_id) return;

    const { id: requesterId, action } = confirmingAction;
    
    try {
      setPendingActions(prev => ({
        ...prev,
        [requesterId]: action
      }));
      
      setConfirmingAction(null);
      setRequestsError(null);
      
      const response = await contactsAPI.updateContactRequest(
        user.user_id,
        requesterId,
        action
      );
      
      if (response) {
        setIncomingRequests(prev => prev.filter(req => req.user_id.toString() !== requesterId.toString()));
        
        setActionSuccess({
          id: requesterId,
          action: action
        });
        
        setTimeout(() => {
          setActionSuccess(null);
        }, 3000);
      }
    } catch (error) {
      console.error(`Failed to ${action} contact request:`, error);
      setRequestsError(`Failed to ${action} request. Please try again.`);
    } finally {
      setPendingActions(prev => {
        const updated = {...prev};
        delete updated[requesterId];
        return updated;
      });
    }
  };
  
  const cancelAction = () => {
    setConfirmingAction(null);
  };

  useEffect(() => {
    const handleProfilePictureUpdate = (event: CustomEvent) => {
      console.log('ChatHeader received profile update:', event.detail.profilePicture);
      setProfilePicture(event.detail.profilePicture);
    };

    setProfilePicture(user?.profilePicture);    
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    };
  }, [user?.profilePicture]);

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
                {contactDetails.contactPicture ? (
                  <img
                    src={contactDetails.contactPicture}
                    alt={contactDetails.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  getInitials(contactDetails.name)
                )}
              </div>
              <div className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900",
                contactDetails.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              )}></div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{contactDetails.name}</h2>
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
        <div className="relative mr-2">
          <button
            ref={bellButtonRef}
            onClick={() => setShowRequestsMenu((v) => !v)}
            className={cn(
              "p-2 rounded-full hover:bg-violet-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200",
              incomingRequests.length > 0 
                ? "text-violet-600 dark:text-violet-400" 
                : "text-gray-500"
            )}
            aria-label="Incoming contact requests"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm animate-pulse-once">
                {incomingRequests.length}
              </span>
            )}
          </button>
          {showRequestsMenu && (
            <div
              ref={requestsMenuRef}
              className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 py-1 z-20 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <span className="font-medium text-gray-800 dark:text-gray-200">Requests</span>
                {loadingRequests && (
                  <svg className="ml-2 animate-spin h-4 w-4 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
              
              {actionSuccess && (
                <div className="mx-3 my-2 p-3 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Contact request {actionSuccess.action === 'accept' ? 'accepted' : 'rejected'} successfully.
                  </span>
                </div>
              )}
              
              {requestsError && (
                <div className="mx-3 my-2 p-3 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{requestsError}</span>
                </div>
              )}
              
              {!loadingRequests && incomingRequests.length === 0 && !requestsError && !actionSuccess && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                  <svg className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="text-sm">No contact requests</span>
                  <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                    When someone adds you as a contact, you'll see their request here
                  </p>
                </div>
              )}
              
              {incomingRequests.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto">
                  {incomingRequests.map((req) => (
                    <div 
                      key={req.user_id} 
                      className={cn(
                        "px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors",
                        pendingActions[req.user_id] ? "bg-gray-50 dark:bg-gray-800/60" : 
                        confirmingAction?.id === req.user_id ? "bg-violet-50 dark:bg-violet-900/20" : 
                        "hover:bg-gray-50 dark:hover:bg-gray-800/80"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-sm font-medium mr-3">
                          {getInitials(req.requester_full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {req.requester_full_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {req.requester_username || 'Wants to connect with you'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        {pendingActions[req.user_id] ? (
                          <div className="flex items-center justify-center p-1 text-violet-600 dark:text-violet-400">
                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs">
                              {pendingActions[req.user_id] === 'accept' ? 'Accepting...' : 'Rejecting...'}
                            </span>
                          </div>
                        ) : confirmingAction && confirmingAction.id === req.user_id ? (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="text-xs font-medium mb-1 text-center text-gray-800 dark:text-gray-200">
                              {confirmingAction.action === 'accept' 
                                ? 'Accept contact request?' 
                                : 'Reject contact request?'}
                            </div>
                            <div className="flex justify-center gap-2">
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                onClick={cancelAction}
                              >
                                Cancel
                              </button>
                              <button
                                className={cn(
                                  "px-2 py-1 text-xs rounded text-white transition-colors",
                                  confirmingAction.action === 'accept'
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : "bg-red-500 hover:bg-red-600"
                                )}
                                onClick={confirmAction}
                              >
                                {confirmingAction.action === 'accept' ? 'Accept' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              className="flex-1 px-2 py-1 text-xs rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              onClick={() => handleRequestAction(req.user_id, 'accept')}
                            >
                              <span className="flex items-center justify-center">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accept
                              </span>
                            </button>
                            <button
                              className="flex-1 px-2 py-1 text-xs rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                              onClick={() => handleRequestAction(req.user_id, 'reject')}
                            >
                              <span className="flex items-center justify-center">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </span>
                            </button>
                          </div>
                        )}
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
               {profilePicture ? (
                   <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      onError={() => setProfilePicture(undefined)}
                      />
                ) : getInitials(user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username || 'User'
                )}
                
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
