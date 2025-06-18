'use client';

import React, { useState, useEffect } from 'react';
import { ContactListItem,API_BASE_URL } from '@/lib/api';
import { getInitials } from './ContactItem';
import { NonGroupMember, groupsAPI } from '@/lib/groupsApi';

interface InviteToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactListItem[];
  groupId: number | null;
  onInvite: (groupId: number, userId: number, role:string) => Promise<void>;
  groupName?: string;
}

export default function InviteToGroupModal({
  isOpen,
  onClose,
  contacts,
  groupId,
  onInvite,
  groupName = 'this group'
}: InviteToGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [invitingUser, setInvitingUser] = useState<number | null>(null);
  const [nonGroupMembers, setNonGroupMembers] = useState<NonGroupMember[]>([]);
  const [fetchingMembers, setFetchingMembers] = useState(false);
  const [confirmingInvite, setConfirmingInvite] = useState<NonGroupMember | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedUsers(new Set());
      setError(null);
      setSuccessMessage(null);
      setInvitingUser(null);
      setConfirmingInvite(null);
      if (groupId) {
        fetchNonGroupMembers(groupId);
      }
    }
  }, [isOpen, groupId]);
  const fetchNonGroupMembers = async (groupId: number) => {
    setFetchingMembers(true);
    setError(null);
    
    try {
      const data = await groupsAPI.fetchNonGroupMembers(groupId);
      setNonGroupMembers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load available users');
      console.error('Error fetching non-group members:', error);
    } finally {
      setFetchingMembers(false);
    }
  };

  const filteredUsers = nonGroupMembers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    return fullName.includes(searchLower) || 
           (user.mobile_number && user.mobile_number.includes(searchQuery));
  });

  const showInviteConfirmation = (user: NonGroupMember) => {
    setConfirmingInvite(user);
  };

  const cancelInvitation = () => {
    setConfirmingInvite(null);
  };

  const confirmInvitation = async () => {
    if (!groupId || !confirmingInvite) return;

    setInvitingUser(confirmingInvite.user_id);
    setError(null);
    setSuccessMessage(null);
    setConfirmingInvite(null);
    
    try {
      await onInvite(groupId, confirmingInvite.user_id, 'member');
      const userName = `${confirmingInvite.first_name} ${confirmingInvite.last_name}`;
      
      setSuccessMessage(`${userName} has been invited to ${groupName}`);
    
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(confirmingInvite.user_id);
        return newSet;
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to invite user');
    } finally {
      setInvitingUser(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite to {groupName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-violet-500 dark:focus:border-violet-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-3 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Notifications section */}
        <div className="px-4">
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800/30 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm border border-green-100 dark:border-green-800/30 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-hidden px-4">
          <div className="relative h-full">
            {/* Subtle top shadow for scroll indication */}
            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
            
            {/* Scrollable area */}
            <div className="h-full overflow-y-auto pb-4 pt-2 px-0.5 space-y-2">
              {fetchingMembers ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="animate-spin h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading available users...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map(user => (
                    <div 
                      key={user.user_id} 
                      className={`relative rounded-lg transition-all duration-150 ${
                        selectedUsers.has(user.user_id) 
                          ? 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/20 border' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center p-3">
                        <div className="flex-shrink-0">
                          {user.profile_picture ? (
                            <img 
                              src={`${API_BASE_URL}${user.profile_picture}`} 
                              alt=""
                              className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 dark:from-violet-600 dark:to-purple-700 flex items-center justify-center text-white text-base font-bold shadow-sm">
                              {getInitials(`${user.first_name} ${user.last_name}`)}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.first_name} {user.last_name}</p>
                            {selectedUsers.has(user.user_id) ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-300">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Invited
                              </span>
                            ) : invitingUser === user.user_id ? (
                              <div className="px-3 py-1 rounded-md">
                                <svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            ) : confirmingInvite?.user_id === user.user_id ? (
                              <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/30 rounded-lg px-3 py-2 shadow-sm">
                                <div className="text-center">
                                  <p className="text-xs text-violet-700 dark:text-violet-300 font-medium mb-2 max-w-[150px] truncate">
                                    Send invite to {user.first_name}?
                                  </p>
                                  <div className="flex space-x-2 justify-center">
                                    <button
                                      onClick={cancelInvitation}
                                      className="px-3 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                      No
                                    </button>
                                    <button
                                      onClick={confirmInvitation}
                                      className="px-3 py-1 text-xs font-medium rounded bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-500 text-white transition-colors"
                                    >
                                      Yes
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => showInviteConfirmation(user)}
                                className="inline-flex items-center px-3 py-1.5 border border-violet-200 dark:border-violet-700 text-xs font-medium rounded-md text-violet-700 dark:text-violet-300 bg-white dark:bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/30 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                              >
                                Invite
                              </button>
                            )}
                          </div>
                     
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'No users found matching your search' : 'No users available to invite'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-violet-600 dark:text-violet-400 text-sm hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Subtle bottom shadow for scroll indication */}
            <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Status footer */}
        {filteredUsers.length > 0 && !fetchingMembers && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                {searchQuery ? ` for "${searchQuery}"` : ''}
              </span>
              {selectedUsers.size > 0 && (
                <span>{selectedUsers.size} invited</span>
              )}
            </div>
          </div>
        )}

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
