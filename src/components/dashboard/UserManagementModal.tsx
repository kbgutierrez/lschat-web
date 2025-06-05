'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { userManagementAPI, User, PaginationData } from '@/lib/userManagementApi';

interface UserAnnouncementSettings {
  canAnnounce: boolean;
  announceScope: 'everyone' | 'groups' | 'users';
  selectedGroups: number[];
  selectedUsers: number[];
  isExpanded: boolean;
}

interface GroupOption {
  group_id: number;
  name: string;
}

interface UserOption {
  user_id: number;
  name: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserManagementModal({
  isOpen,
  onClose,
}: UserManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    currentPage: 1,
    perPage: 10
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [availableGroups, setAvailableGroups] = useState<GroupOption[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [userSettings, setUserSettings] = useState<Record<string, UserAnnouncementSettings>>({});
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
     
      setError(null);
      setSuccess(null);
      setSearchTerm('');
      

      fetchUsers(1);
 
      setAvailableGroups([
        { group_id: 1, name: 'Marketing Team' },
        { group_id: 2, name: 'Development Team' },
        { group_id: 3, name: 'Sales Department' },
        { group_id: 4, name: 'Customer Support' },
        { group_id: 5, name: 'Human Resources' }
      ]);
      
      setAvailableUsers([
        { user_id: 101, name: 'Alice Johnson' },
        { user_id: 102, name: 'Bob Smith' },
        { user_id: 103, name: 'Carol Williams' },
        { user_id: 104, name: 'Dave Brown' },
        { user_id: 105, name: 'Eve Davis' }
      ]);
    }
  }, [isOpen]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchUsers = async (page: number) => {
    setIsFetchingUsers(true);
    setError(null);
    
    try {
      const response = await userManagementAPI.fetchUsers(page, pagination.perPage);
      setUsers(response.users);
      setPagination(response.pagination);
  
      const initialSettings: Record<string, UserAnnouncementSettings> = {};
      response.users.forEach(user => {
        initialSettings[user.user_id] = {
          canAnnounce: !!user.can_announce,
          announceScope: 'everyone',
          selectedGroups: [],
          selectedUsers: [],
          isExpanded: false
        };
      });
      
      setUserSettings(initialSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchUsers(newPage);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatePromises = Object.entries(userSettings).map(async ([userId, settings]) => {
        const numericUserId = parseInt(userId, 10);
        
  
      });
      
      await Promise.all(updatePromises);
      setSuccess('User announcement settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleAnnouncePermission = (userId: string) => {
    setUserSettings(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        canAnnounce: !prev[userId].canAnnounce,
        isExpanded: !prev[userId].canAnnounce 
      }
    }));
  };
  
  const toggleExpand = (userId: string) => {
    setUserSettings(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        isExpanded: !prev[userId].isExpanded
      }
    }));
  };
  
  const updateAnnounceScope = (userId: string, scope: 'everyone' | 'groups' | 'users') => {
    setUserSettings(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        announceScope: scope
      }
    }));
  };
  
  const toggleGroup = (userId: string, groupId: number) => {
    setUserSettings(prev => {
      const userSetting = prev[userId];
      const selectedGroups = userSetting.selectedGroups.includes(groupId)
        ? userSetting.selectedGroups.filter(id => id !== groupId)
        : [...userSetting.selectedGroups, groupId];
      
      return {
        ...prev,
        [userId]: {
          ...userSetting,
          selectedGroups
        }
      };
    });
  };
  
  const toggleUser = (userId: string, targetUserId: number) => {
    setUserSettings(prev => {
      const userSetting = prev[userId];
      const selectedUsers = userSetting.selectedUsers.includes(targetUserId)
        ? userSetting.selectedUsers.filter(id => id !== targetUserId)
        : [...userSetting.selectedUsers, targetUserId];
      
      return {
        ...prev,
        [userId]: {
          ...userSetting,
          selectedUsers
        }
      };
    });
  };
  
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower) 
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            User Management
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

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-3 py-2 pl-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-violet-500 focus:border-violet-500 dark:focus:ring-violet-400 dark:focus:border-violet-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {error && (
            <div className="m-5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800/30">
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="m-5 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm border border-green-100 dark:border-green-800/30">
              <p>{success}</p>
            </div>
          )}

          {/* User List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">User</th>
               
                  <th scope="col" className="px-6 py-3">Can Announce</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetchingUsers ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-violet-500 rounded-full border-t-transparent"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No users match your search criteria' : 'No users available'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const settings = userSettings[user.user_id];
                    if (!settings) return null;
                    
                    return (
                      <React.Fragment key={user.user_id}>
                        <tr className=" bg-white border-b border-b-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              {user.profile_picture ? (
                                <img 
                                  src={user.profile_picture} 
                                  alt={`${user.first_name} ${user.last_name}`}
                                  className="w-8 h-8 rounded-full mr-3 object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center mr-3 text-sm font-medium">
                                  {user.first_name?.[0]}{user.last_name?.[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{user.first_name} {user.last_name}</div>
                           
                              </div>
                            </div>
                          </td>
                
                          <td className="px-6 py-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.canAnnounce}
                                onChange={() => toggleAnnouncePermission(user.user_id.toString())}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                            </label>
                          </td>
                          <td className="px-6 py-4">
                            {settings.canAnnounce && (
                              <button
                                onClick={() => toggleExpand(user.user_id.toString())}
                                className="font-medium text-violet-600 dark:text-violet-500 hover:underline flex items-center"
                              >
                                {settings.isExpanded ? (
                                  <>
                                    <span>Hide Options</span>
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                  </>
                                ) : (
                                  <>
                                    <span>Configure</span>
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                        
                        {/* Expanded options row */}
                        {settings.canAnnounce && settings.isExpanded && (
                          <tr className="bg-gray-50 dark:bg-gray-800/30">
                            <td colSpan={4} className="px-6 py-4">
                              <div className="border-l-2 border-violet-300 dark:border-violet-800 pl-4 space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Announcement scope:</p>
                                  
                                  <div className="space-y-2">
                                    <label className="flex items-center">
                                      <input 
                                        type="radio" 
                                        name={`announceScope_${user.user_id}`} 
                                        value="everyone"
                                        checked={settings.announceScope === 'everyone'}
                                        onChange={() => updateAnnounceScope(user.user_id.toString(), 'everyone')}
                                        className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                      />
                                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Everyone (broadcast to all users)</span>
                                    </label>
                                    
                                    <label className="flex items-center">
                                      <input 
                                        type="radio" 
                                        name={`announceScope_${user.user_id}`} 
                                        value="groups"
                                        checked={settings.announceScope === 'groups'}
                                        onChange={() => updateAnnounceScope(user.user_id.toString(), 'groups')}
                                        className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                      />
                                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Specific groups</span>
                                    </label>
                                    
                                    <label className="flex items-center">
                                      <input 
                                        type="radio" 
                                        name={`announceScope_${user.user_id}`} 
                                        value="users"
                                        checked={settings.announceScope === 'users'}
                                        onChange={() => updateAnnounceScope(user.user_id.toString(), 'users')}
                                        className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                      />
                                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Individual users</span>
                                    </label>
                                  </div>
                                </div>
                                
                                {/* Groups selection */}
                                {settings.announceScope === 'groups' && (
                                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                                    <div className="mb-3">
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Select groups
                                      </label>
                                    </div>
                                    
                                    <div className="max-h-48 overflow-y-auto space-y-1 p-1">
                                      {availableGroups.length > 0 ? (
                                        availableGroups.map((group) => (
                                          <div
                                            key={group.group_id}
                                            className={cn(
                                              "flex items-center p-2 rounded-md cursor-pointer",
                                              settings.selectedGroups.includes(group.group_id)
                                                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300"
                                                : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                                            )}
                                            onClick={() => toggleGroup(user.user_id.toString(), group.group_id)}
                                          >
                                            <div className="flex items-center">
                                              <input
                                                type="checkbox"
                                                checked={settings.selectedGroups.includes(group.group_id)}
                                                onChange={() => {}}
                                                className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                              />
                                              <span className="ml-3 text-sm font-medium">{group.name}</span>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">
                                          No groups found
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                      Selected: {settings.selectedGroups.length} group(s)
                                    </div>
                                  </div>
                                )}
                                
                                {/* Users selection */}
                                {settings.announceScope === 'users' && (
                                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                                    <div className="mb-3">
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Select users
                                      </label>
                                    </div>
                                    
                                    <div className="max-h-48 overflow-y-auto space-y-1 p-1">
                                      {availableUsers.length > 0 ? (
                                        availableUsers.map((targetUser) => (
                                          <div
                                            key={targetUser.user_id}
                                            className={cn(
                                              "flex items-center p-2 rounded-md cursor-pointer",
                                              settings.selectedUsers.includes(targetUser.user_id)
                                                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300"
                                                : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                                            )}
                                            onClick={() => toggleUser(user.user_id.toString(), targetUser.user_id)}
                                          >
                                            <div className="flex items-center">
                                              <input
                                                type="checkbox"
                                                checked={settings.selectedUsers.includes(targetUser.user_id)}
                                                onChange={() => {}}
                                                className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                              />
                                              <span className="ml-3 text-sm font-medium">{targetUser.name}</span>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">
                                          No users found
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                      Selected: {settings.selectedUsers.length} user(s)
                                    </div>
                                  </div>
                                )}
                                
                                {/* Helpful reminder for the everyone option */}
                                {settings.announceScope === 'everyone' && (
                                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md border border-blue-100 dark:border-blue-800/30">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm">
                                      This user will be able to send announcements to all users in the system.
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-1 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || isFetchingUsers}
                className={`px-3 py-1 rounded-md ${
                  pagination.currentPage === 1 || isFetchingUsers
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={isFetchingUsers}
                  className={`px-3 py-1 rounded-md ${
                    page === pagination.currentPage
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${isFetchingUsers ? 'cursor-not-allowed' : ''}`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.pages || isFetchingUsers}
                className={`px-3 py-1 rounded-md ${
                  pagination.currentPage === pagination.pages || isFetchingUsers
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md mr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 border border-transparent rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : 'Save Changes'}
          </button>
        </div>
        
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