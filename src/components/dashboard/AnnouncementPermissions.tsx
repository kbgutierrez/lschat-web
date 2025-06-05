'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: number;
  can_announce: number;
  profile_picture: string | null;
}

interface GroupOption {
  group_id: number;
  name: string;
}

interface UserOption {
  user_id: number;
  name: string;
  profile_picture: string | null;
}

interface UserAnnouncementSettings {
  canAnnounce: boolean;
  announceScope: 'everyone' | 'groups' | 'users';
  selectedGroups: number[];
  selectedUsers: number[];
}

interface AnnouncementPermissionsProps {
  user: User | null;
  settings: UserAnnouncementSettings | null;
  availableGroups: GroupOption[];
  availableUsers: UserOption[];
  onToggleAnnouncePermission: (userId: string) => void;
  onUpdateAnnounceScope: (userId: string, scope: 'everyone' | 'groups' | 'users') => void;
  onToggleGroup: (userId: string, groupId: number) => void;
  onToggleUser: (userId: string, targetUserId: number) => void;
  onSelectAllGroups?: (userId: string, selectAll: boolean) => void;
  onSelectAllUsers?: (userId: string, selectAll: boolean) => void;
}

export default function AnnouncementPermissions({
  user,
  settings,
  availableGroups,
  availableUsers,
  onToggleAnnouncePermission,
  onUpdateAnnounceScope,
  onToggleGroup,
  onToggleUser,
  onSelectAllGroups,
  onSelectAllUsers,
}: AnnouncementPermissionsProps) {
  if (!user || !settings) return null;

  const userId = user.user_id.toString();

  // Calculate select all states for groups
  const allGroupsSelected = availableGroups.length > 0 && settings.selectedGroups.length === availableGroups.length;
  const someGroupsSelected = settings.selectedGroups.length > 0 && settings.selectedGroups.length < availableGroups.length;
  
  // Calculate select all states for users
  const allUsersSelected = availableUsers.length > 0 && settings.selectedUsers.length === availableUsers.length;
  const someUsersSelected = settings.selectedUsers.length > 0 && settings.selectedUsers.length < availableUsers.length;

  const handleSelectAllGroups = () => {
    if (onSelectAllGroups) {
      onSelectAllGroups(userId, !allGroupsSelected);
    }
  };

  const handleSelectAllUsers = () => {
    if (onSelectAllUsers) {
      onSelectAllUsers(userId, !allUsersSelected);
    }
  };

  function getInitials(name?: string): string {
    if (!name) return "";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white text-lg">
            Announcement Permissions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Control whether this user can send announcements
          </p>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
            {settings.canAnnounce ? 'Enabled' : 'Disabled'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.canAnnounce}
            onClick={() => onToggleAnnouncePermission(userId)}
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
              settings.canAnnounce ? "bg-violet-600 dark:bg-violet-500" : "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <span className="sr-only">
              {settings.canAnnounce ? 'Disable' : 'Enable'} announcement permissions
            </span>
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                settings.canAnnounce ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {settings.canAnnounce && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Who can receive announcements from this user?
              </label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-violet-600 focus:ring-violet-500 dark:bg-gray-700 dark:checked:bg-violet-500 dark:border-gray-600"
                    name={`announce-scope-${userId}`}
                    checked={settings.announceScope === 'everyone'}
                    onChange={() => onUpdateAnnounceScope(userId, 'everyone')}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Everyone</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-violet-600 focus:ring-violet-500 dark:bg-gray-700 dark:checked:bg-violet-500 dark:border-gray-600"
                    name={`announce-scope-${userId}`}
                    checked={settings.announceScope === 'groups'}
                    onChange={() => onUpdateAnnounceScope(userId, 'groups')}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Selected Groups</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-violet-600 focus:ring-violet-500 dark:bg-gray-700 dark:checked:bg-violet-500 dark:border-gray-600"
                    name={`announce-scope-${userId}`}
                    checked={settings.announceScope === 'users'}
                    onChange={() => onUpdateAnnounceScope(userId, 'users')}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Selected Users</span>
                </label>
              </div>
            </div>

            {settings.announceScope === 'groups' && (
              <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="mb-3 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Groups</h3>
                  {availableGroups.length > 0 && (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox rounded text-violet-600 focus:ring-violet-500 dark:bg-gray-700 dark:border-gray-600"
                        checked={allGroupsSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someGroupsSelected;
                        }}
                        onChange={handleSelectAllGroups}
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Select All ({settings.selectedGroups.length}/{availableGroups.length})
                      </span>
                    </label>
                  )}
                </div>
                <div className="max-h-72 h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {availableGroups.length > 0 ? (
                    <div className="space-y-2">
                      {availableGroups.map(group => (
                        <label key={group.group_id} className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox rounded text-violet-600 focus:ring-violet-500 dark:bg-gray-700 dark:border-gray-600"
                            checked={settings.selectedGroups.includes(group.group_id)}
                            onChange={() => onToggleGroup(userId, group.group_id)}
                          />
                          <span className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">{group.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6 text-center bg-gray-50 dark:bg-gray-700/30 rounded-md">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No groups available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {settings.announceScope === 'users' && (
                <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="mb-3 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Users</h3>
                      {availableUsers.length > 0 && (
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox rounded text-violet-600 focus:ring-violet-500 dark:bg-gray-700 dark:border-gray-600"
                            checked={allUsersSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = someUsersSelected;
                            }}
                            onChange={handleSelectAllUsers}
                          />
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            Select All ({settings.selectedUsers.length}/{availableUsers.length})
                          </span>
                        </label>
                      )}
                    </div>
                    <div className="max-h-72 h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {availableUsers.length > 0 ? (
                            <div className="grid gap-2">
                                {availableUsers.map(u => (
                                    <label 
                                        key={u.user_id} 
                                        className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-checkbox rounded text-violet-600 focus:ring-violet-500 dark:bg-gray-700 dark:border-gray-600 mr-3"
                                            checked={settings.selectedUsers.includes(u.user_id)}
                                            onChange={() => onToggleUser(userId, u.user_id)}
                                        />
                                        <div className="flex items-center flex-1">
                                            {u.profile_picture ? (
                                                <img
                                                    src={u.profile_picture}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center border border-violet-200 dark:border-violet-800">
                                                    <span className="text-xs font-medium text-violet-700 dark:text-violet-300">{getInitials(u.name)}</span>
                                                </div>
                                            )}
                                            <span className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">{u.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-6 text-center bg-gray-50 dark:bg-gray-700/30 rounded-md">
                                <p className="text-sm text-gray-500 dark:text-gray-400">No users available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}