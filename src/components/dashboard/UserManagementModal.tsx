'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { userManagementAPI, User, PaginationData } from '@/lib/userManagementApi';
import AnnouncementPermissions from './AnnouncementPermissions';

type ManagementTabType = 'announcements';

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
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

export default function UserManagementModal({
    isOpen,
    onClose,
}: UserManagementModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

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
    const [defaultSettings, setDefaultSettings] = useState<Record<string, UserAnnouncementSettings>>({});
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [activeManagementTab, setActiveManagementTab] = useState<ManagementTabType>('announcements');
    const [isFetchingPermissions, setIsFetchingPermissions] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);
    const tabIndicatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSuccess(null);
            setSearchTerm('');
            setSelectedUserId(null);

            fetchUsers(1);
            const fetchGroups = async () => {
                try {
                    const response = await userManagementAPI.fetchGroups();
                    if (response.success && response.groups) {
                        const groupOptions: GroupOption[] = response.groups.map((group: any, index: number) => ({
                            group_id: group.group_id || index + 1,
                            name: group.name || 'Unknown Group'
                        }));
                        setAvailableGroups(groupOptions);
                    }
                } catch (err) {
                    console.error('Error fetching groups:', err);
                    setAvailableGroups([]);
                }
            };

            const fetchAvailableUsers = async () => {
                try {
                    const response = await userManagementAPI.fetchUsers(1, 100); 
                    if (response.success && response.users) {
                        const userOptions: UserOption[] = response.users.map(user => ({
                            user_id: user.user_id,
                            name: `${user.first_name} ${user.last_name}`.trim() || user.username,
                            profile_picture: user.profile_picture
                        }));
                        setAvailableUsers(userOptions);
                    }
                } catch (err) {
                    console.error('Error fetching available users:', err);
                    setAvailableUsers([]);
                }
            };

            fetchGroups();
            fetchAvailableUsers();
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

    const loadUserAnnouncementPermissions = async (userId: number) => {
        if (!userId) return;
        
        setIsFetchingPermissions(true);
        setError(null);
        
        try {
            const permissionsResponse = await userManagementAPI.fetchAnnouncementPermissions(userId);
            
            if (permissionsResponse.success) {
                const userIdStr = userId.toString();
                const currentSettings = userSettings[userIdStr] || {
                    canAnnounce: false,
                    announceScope: 'everyone',
                    selectedGroups: [],
                    selectedUsers: []
                };
                
                // Determine the announcement scope based on permissionType
                let announceScope: 'everyone' | 'groups' | 'users' = 'everyone';
                if (permissionsResponse.permissionType === 'byGroup') {
                    announceScope = 'groups';
                } else if (permissionsResponse.permissionType === 'byUser') {
                    announceScope = 'users';
                }
                
                // Extract selected group IDs and user IDs from the response
                const selectedGroups = permissionsResponse.groups.map(group => group.group_id);
                const selectedUsers = permissionsResponse.users.map(user => user.user_id);
                
                // Find the user in our users array to get their current can_announce value
                const userObj = users.find(u => u.user_id === userId);
                
                const newSettings = {
                    ...currentSettings,
                    canAnnounce: userObj ? userObj.can_announce === 1 : currentSettings.canAnnounce,
                    announceScope,
                    selectedGroups,
                    selectedUsers
                };
                
                setUserSettings(prev => ({
                    ...prev,
                    [userIdStr]: newSettings
                }));
                
                // Store the default settings
                setDefaultSettings(prev => ({
                    ...prev,
                    [userIdStr]: {...newSettings}
                }));
                
                console.log('Loaded announcement permissions:', permissionsResponse);
            }
        } catch (err) {
            console.error('Error fetching announcement permissions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch announcement permissions');
        } finally {
            setIsFetchingPermissions(false);
        }
    };

    const resetToDefaultSettings = (userId: string) => {
        if (defaultSettings[userId]) {
            setUserSettings(prev => ({
                ...prev,
                [userId]: {...defaultSettings[userId]}
            }));
        }
    };

    const fetchUsers = async (page: number) => {
        setIsFetchingUsers(true);
        setError(null);

        try {
            const response = await userManagementAPI.fetchUsers(page, pagination.perPage);
            setUsers(response.users);
            setPagination(response.pagination);

            const initialSettings: Record<string, UserAnnouncementSettings> = {};
            response.users.forEach(user => {
                initialSettings[user.user_id.toString()] = {
                    canAnnounce: user.can_announce === 1,
                    announceScope: 'everyone',
                    selectedGroups: [],
                    selectedUsers: []
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
            setSelectedUserId(null);
        }
    };

    const handleSaveChanges = async () => {
        setShowConfirmation(true);
    };

    const handleConfirmSave = async () => {
        setShowConfirmation(false);
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const updatePromises = Object.entries(userSettings).map(async ([userId, settings]) => {
                const numericUserId = parseInt(userId, 10);

                const user = users.find(u => u.user_id === numericUserId);
                if (user) {
                    if ((user.can_announce === 1) !== settings.canAnnounce) {
                        await userManagementAPI.toggleCanAnnounce(userId, user.can_announce);
                    }
                    
                    if (settings.canAnnounce) {
                        let permissionType: 'everyone' | 'byGroup' | 'byUser';
                        
                        switch(settings.announceScope) {
                            case 'groups':
                                permissionType = 'byGroup';
                                break;
                            case 'users':
                                permissionType = 'byUser';
                                break;
                            default:
                                permissionType = 'everyone';
                        }
                        
                        const groups = permissionType === 'byGroup' ? settings.selectedGroups : [];
                        const users = permissionType === 'byUser' ? settings.selectedUsers : [];
                        
                        await userManagementAPI.updateAnnouncementPermissions(
                            numericUserId,
                            permissionType,
                            groups,
                            users
                        );
                    }
                }
            });

            await Promise.all(updatePromises);
            setSuccess('User announcement settings saved successfully');
            setShowSuccessAlert(true);
            
            setTimeout(() => {
                setShowSuccessAlert(false);
            }, 3000);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
            setShowErrorAlert(true);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCancelSave = () => {
        setShowConfirmation(false);
    };

    const toggleAnnouncePermission = (userId: string) => {
        setUserSettings(prev => {

            const user = users.find(u => u.user_id.toString() === userId);
            const previousSetting = prev[userId]?.canAnnounce || false;

            const updated = {
                ...prev,
                [userId]: {
                    ...prev[userId],
                    canAnnounce: !previousSetting
                }
            };
            if (!previousSetting) {
                setSelectedUserId(userId);
            }

            return updated;
        });
    };

    const updateAnnounceScope = (userId: string, scope: 'everyone' | 'groups' | 'users') => {
        setUserSettings(prev => {
            const currentSettings = {...prev[userId]};
            
            if (scope === 'everyone') {
                return {
                    ...prev,
                    [userId]: {
                        ...currentSettings,
                        announceScope: scope,
                        selectedGroups: [],
                        selectedUsers: []
                    }
                };
            } else if (scope === 'groups') {
                return {
                    ...prev,
                    [userId]: {
                        ...currentSettings,
                        announceScope: scope,
                        selectedUsers: []
                    }
                };
            } else {
                return {
                    ...prev,
                    [userId]: {
                        ...currentSettings,
                        announceScope: scope,
                        selectedGroups: []
                    }
                };
            }
        });
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

    const handleSelectAllGroups = (userId: string, selectAll: boolean) => {
        setUserSettings(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                selectedGroups: selectAll ? availableGroups.map(g => g.group_id) : []
            }
        }));
    };

    const handleSelectAllUsers = (userId: string, selectAll: boolean) => {
        setUserSettings(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                selectedUsers: selectAll ? availableUsers.map(u => u.user_id) : []
            }
        }));
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

    const selectedUser = selectedUserId
        ? users.find(u => u.user_id.toString() === selectedUserId)
        : null;

    const selectedUserSettings = selectedUserId
        ? userSettings[selectedUserId]
        : null;

    const handleManagementTabChange = (tab: ManagementTabType) => {
        setActiveManagementTab(tab);

        if (tabIndicatorRef.current) {
            const tabElement = document.querySelector(`[data-management-tab="${tab}"]`);
            if (tabElement) {
                const tabRect = tabElement.getBoundingClientRect();
                const tabContainerRect = tabElement.parentElement?.getBoundingClientRect() || tabRect;

                const left = tabRect.left - tabContainerRect.left;
                const width = tabRect.width;

                tabIndicatorRef.current.style.left = `${left}px`;
                tabIndicatorRef.current.style.width = `${width}px`;
            }
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-full border border-gray-200 dark:border-gray-700 h-[100vh] max-h-[100vh] flex flex-col overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white dark:from-gray-800 dark:to-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <svg className="w-6 h-6 mr-2 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        User Management
                        <span className="ml-2 text-sm bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
                            Admin
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search users by name"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-violet-500 focus:border-violet-500 dark:focus:ring-violet-400 dark:focus:border-violet-400 shadow-sm"
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
                                        aria-label="Clear search"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isFetchingUsers ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading users...
                                    </div>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-5">
                                    <svg className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">
                                        No users found
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center">
                                        Try adjusting your search criteria
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map(user => (
                                        <li
                                            key={user.user_id}
                                            className={cn(
                                                "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors duration-150",
                                                selectedUserId === user.user_id.toString() && "bg-violet-50 dark:bg-violet-900/10"
                                            )}
                                            onClick={() => {
                                                setSelectedUserId(user.user_id.toString());
                                                loadUserAnnouncementPermissions(user.user_id);
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        {user.profile_picture ? (
                                                            <img
                                                                src={user.profile_picture}
                                                                alt={`${user.first_name} ${user.last_name}`}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center">
                                                                <span className="text-violet-700 dark:text-violet-300 font-medium text-sm">
                                                                    {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {user.first_name} {user.last_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {pagination.pages > 1 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 py-2 px-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className={cn(
                                            "px-3 py-1 rounded text-sm",
                                            pagination.currentPage === 1
                                                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                                : "text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
                                        )}
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Page {pagination.currentPage} of {pagination.pages}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.pages}
                                        className={cn(
                                            "px-3 py-1 rounded text-sm",
                                            pagination.currentPage === pagination.pages
                                                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                                : "text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
                                        )}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-3/5 flex flex-col">
                        <AnimatePresence mode="wait">
                            {selectedUser && selectedUserSettings ? (
                                <motion.div
                                    className="flex-1 flex flex-col h-full"
                                    key="user-selected"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center">
                                        <div className="flex-shrink-0">
                                            {selectedUser.profile_picture ? (
                                                <img
                                                    src={selectedUser.profile_picture}
                                                    alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                                                    className="h-14 w-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                                                />
                                            ) : (
                                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 dark:from-violet-600 dark:to-purple-700 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm">
                                                    <span className="text-white font-medium text-lg">
                                                        {(selectedUser.first_name?.[0] || '') + (selectedUser.last_name?.[0] || '')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {selectedUser.first_name} {selectedUser.last_name}
                                            </h3>
                                            <div className="flex items-center mt-1">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mr-3">
                                                    {selectedUser.email}
                                                </p>
                                                {selectedUser.is_admin === 1 && (
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/30">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex space-x-6 relative">
                                        <button
                                            className="cursor-pointer text-violet-600 dark:text-violet-400 font-medium text-sm pb-3 outline-0 "
                                            style={{ boxShadow: 'none', outline: 'none' }}
                                            onClick={() => handleManagementTabChange('announcements')}
                                            data-management-tab="announcements"
                                        >
                                            Announcement Settings
                                        </button>
                                        <div ref={tabIndicatorRef} className="absolute bottom-0 h-0.5 bg-violet-600 dark:bg-violet-400 transition-all duration-200" style={{ left: '0px', width: '0px' }}></div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        <AnimatePresence mode="wait">
                                            {activeManagementTab === 'announcements' && (
                                                <motion.div
                                                    key="announcements-tab"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="p-6 space-y-6"
                                                >
                                                    {isFetchingPermissions ? (
                                                        <div className="flex justify-center py-8">
                                                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Loading permissions...
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <AnnouncementPermissions
                                                            user={selectedUser}
                                                            settings={userSettings[selectedUser.user_id.toString()]}
                                                            defaultSettings={defaultSettings[selectedUser.user_id.toString()]}
                                                            availableGroups={availableGroups}
                                                            availableUsers={availableUsers}
                                                            onToggleAnnouncePermission={toggleAnnouncePermission}
                                                            onUpdateAnnounceScope={updateAnnounceScope}
                                                            onToggleGroup={toggleGroup}
                                                            onToggleUser={toggleUser}
                                                            onSelectAllGroups={handleSelectAllGroups}
                                                            onSelectAllUsers={handleSelectAllUsers}
                                                            onReset={resetToDefaultSettings}
                                                        />
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md mr-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveChanges}
                                            disabled={loading}
                                            className={cn(
                                                "cursor-pointer px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 transition-colors",
                                                loading
                                                    ? "bg-violet-400 dark:bg-violet-700 cursor-not-allowed"
                                                    : "bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500"
                                            )}
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
                                    
                                    {showConfirmation && (
                                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                            <motion.div 
                                                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden"
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                            >
                                                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                                        <svg className="w-5 h-5 mr-2 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Confirm Changes
                                                    </h3>
                                                </div>
                                                <div className="p-5">
                                                    <p className="text-gray-700 dark:text-gray-300">
                                                        Are you sure you want to save these changes to user announcement permissions?
                                                    </p>
                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        This will update which users can send announcements and to whom they can be sent.
                                                    </p>
                                                </div>
                                                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelSave}
                                                        className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleConfirmSave}
                                                        className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-user-selected"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full flex flex-col items-center justify-center text-center p-5"
                                >
                                    <svg className="h-20 w-20 text-gray-300 dark:text-gray-600 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C9.38 2 7.25 4.13 7.25 6.75C7.25 9.32 9.26 11.4 11.88 11.49C11.96 11.48 12.04 11.48 12.1 11.49C12.12 11.49 12.13 11.49 12.15 11.49C12.16 11.49 12.16 11.49 12.17 11.49C14.73 11.4 16.74 9.32 16.75 6.75C16.75 4.13 14.62 2 12 2Z" fill="currentColor" opacity="0.4"/>
                                        <path d="M17.08 14.15C14.29 12.29 9.74 12.29 6.93 14.15C5.66 15 4.96 16.15 4.96 17.38C4.96 18.61 5.66 19.75 6.92 20.59C8.32 21.53 10.16 22 12 22C13.84 22 15.68 21.53 17.08 20.59C18.34 19.74 19.04 18.6 19.04 17.36C19.03 16.13 18.34 14.99 17.08 14.15Z" fill="currentColor"/>
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">Select a user to manage</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                        Click on a user from the list to view and configure their settings
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <AnimatePresence>
                    {showSuccessAlert && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] bg-green-50 dark:bg-green-900/30 px-6 py-4 rounded-lg shadow-lg border border-green-200 dark:border-green-800/50 max-w-md"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                        {success}
                                    </p>
                                </div>
                                <div className="ml-auto pl-3">
                                    <div className="-mx-1.5 -my-1.5">
                                        <button
                                            onClick={() => setShowSuccessAlert(false)}
                                            className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-800/50 focus:outline-none"
                                        >
                                            <span className="sr-only">Dismiss</span>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showErrorAlert && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] bg-red-50 dark:bg-red-900/30 px-6 py-4 rounded-lg shadow-lg border border-red-200 dark:border-red-800/50 max-w-md"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        {error}
                                    </p>
                                </div>
                                <div className="ml-auto pl-3">
                                    <div className="-mx-1.5 -my-1.5">
                                        <button
                                            onClick={() => setShowErrorAlert(false)}
                                            className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-800/50 focus:outline-none"
                                        >
                                            <span className="sr-only">Dismiss</span>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {showConfirmation && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Confirm Changes
                                </h3>
                            </div>
                            <div className="p-5">
                                <p className="text-gray-700 dark:text-gray-300">
                                    Are you sure you want to save these changes to user announcement permissions?
                                </p>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    This will update which users can send announcements and to whom they can be sent.
                                </p>
                            </div>
                            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleCancelSave}
                                    className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmSave}
                                    className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}