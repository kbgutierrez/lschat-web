'use client';

import React, { useState, useEffect } from 'react';
import { ContactListItem } from '@/lib/api';
import { getInitials } from './ContactItem';
import { NonGroupMember, groupsAPI } from '@/lib/groupsApi';

interface InviteToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactListItem[];
  groupId: number | null;
  onInvite: (groupId: number, userId: number) => Promise<void>;
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
      await onInvite(groupId, confirmingInvite.user_id);
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
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        
        {/* Header and search remain unchanged */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Invite to {groupName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-4 py-2 pl-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-violet-500 dark:focus:border-violet-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          <div className="flex-1 overflow-y-auto max-h-[calc(100%-2rem)]">
            {fetchingMembers ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map(user => (
                  <li key={user.user_id} className="py-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-violet-200 dark:bg-violet-900/50 flex items-center justify-center text-violet-700 dark:text-violet-300 text-base font-bold mr-3">
                          {user.profile_picture ? (
                            <img 
                              src={user.profile_picture} 
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            getInitials(`${user.first_name} ${user.last_name}`)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.mobile_number}</p>
                        </div>
                      </div>
                      <div className="relative">
                        {selectedUsers.has(user.user_id) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
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
                          <div className="bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg px-2.5 py-1.5 transition-all duration-200 shadow-sm">
                            <p className="text-xs text-violet-700 dark:text-violet-300 font-medium mb-1.5">
                              Invite {user.first_name}?
                            </p>
                            <div className="flex space-x-2 justify-between">
                              <button
                                onClick={cancelInvitation}
                                className="flex-1 px-2 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={confirmInvitation}
                                className="flex-1 px-2 py-1 text-xs font-medium rounded-md bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-white transition-colors"
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => showInviteConfirmation(user)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                          >
                            Invite
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No users found matching your search' : 'No users available to invite'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
