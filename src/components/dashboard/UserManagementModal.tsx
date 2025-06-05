'use client';

import React, { useState, useEffect, useRef } from 'react';
import { userManagementAPI, User, PaginationData } from '@/lib/userManagementApi';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

// Management tab types
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
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [activeManagementTab, setActiveManagementTab] = useState<ManagementTabType>('announcements');

    const modalRef = useRef<HTMLDivElement>(null);
    const tabIndicatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSuccess(null);
            setSearchTerm('');
            setSelectedUserId(null);

            fetchUsers(1);

            // Fetch available groups from API
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

            // Fetch available users to use as announcement targets
            const fetchAvailableUsers = async () => {
                try {
                    const response = await userManagementAPI.fetchUsers(1, 100); // Get up to 100 users
                    if (response.success && response.users) {
                        const userOptions: UserOption[] = response.users.map(user => ({
                            user_id: user.user_id,
                            name: `${user.first_name} ${user.last_name}`.trim() || user.username
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
                    announceScope: 'everyone', // default scope
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
                }
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
        setUserSettings(prev => {
            // Find the user to get current can_announce value
            const user = users.find(u => u.user_id.toString() === userId);
            const previousSetting = prev[userId]?.canAnnounce || false;

            const updated = {
                ...prev,
                [userId]: {
                    ...prev[userId],
                    canAnnounce: !previousSetting
                }
            };

            // If turning on permissions, select the user so they can configure details
            if (!previousSetting) {
                setSelectedUserId(userId);
            }

            return updated;
        });
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
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
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

        // Animate the tab indicator
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
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
                {/* Header */}
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
                        className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Notification area */}
                {(error || success) && (
                    <div className="px-5 pt-4">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800/30 flex items-start">
                                <svg className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm border border-green-100 dark:border-green-800/30 flex items-start">
                                <svg className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>{success}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Two-panel content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left panel - User list */}
                    <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                        {/* Search */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
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

                        {/* User list */}
                        <div className="flex-1 overflow-y-auto">
                            {isFetchingUsers ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Loading users...</span>
                                    </div>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-5">
                                    <svg className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">
                                        {searchTerm ? 'No users match your search criteria' : 'No users available'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center">
                                        {searchTerm ? 'Try adjusting your search or clear the filter' : 'User data will appear here once users are added to the system'}
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map(user => {
                                        const settings = userSettings[user.user_id.toString()];
                                        const isSelected = selectedUserId === user.user_id.toString();

                                        return (
                                            <li
                                                key={user.user_id}
                                                className={cn(
                                                    "hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer relative",
                                                    isSelected && "bg-violet-50 dark:bg-violet-900/20"
                                                )}
                                                onClick={() => setSelectedUserId(user.user_id.toString())}
                                            >
                                                <div className="flex items-center px-4 py-3">
                                                    <div className="flex-shrink-0">
                                                        {user.profile_picture ? (
                                                            <img
                                                                src={user.profile_picture}
                                                                alt={`${user.first_name} ${user.last_name}`}
                                                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center text-sm font-medium border border-violet-200 dark:border-violet-800/50">
                                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {user.first_name} {user.last_name}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Selection indicator */}
                                                {isSelected && (
                                                    <div className="absolute inset-y-0 left-0 w-1 bg-violet-500 dark:bg-violet-500"></div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 py-2 px-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1 || isFetchingUsers}
                                        className={cn(
                                            "px-2 py-1 text-xs border rounded-md flex items-center transition-colors",
                                            pagination.currentPage === 1 || isFetchingUsers
                                                ? "text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                                : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        )}
                                        aria-label="Previous page"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span>Previous</span>
                                    </button>

                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Page {pagination.currentPage} of {pagination.pages}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.pages || isFetchingUsers}
                                        className={cn(
                                            "px-2 py-1 text-xs border rounded-md flex items-center transition-colors",
                                            pagination.currentPage === pagination.pages || isFetchingUsers
                                                ? "text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                                : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        )}
                                        aria-label="Next page"
                                    >
                                        <span>Next</span>
                                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right panel - User configuration with tabs */}
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
                                    {/* User header - fixed at top */}
                                    <div className="px-6 pt-6 pb-3 flex items-center border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                                        <div className="flex-shrink-0">
                                            {selectedUser.profile_picture ? (
                                                <img
                                                    src={selectedUser.profile_picture}
                                                    alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 mr-4"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center text-xl font-medium border-2 border-violet-200 dark:border-violet-800/50 mr-4">
                                                    {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                {selectedUser.first_name} {selectedUser.last_name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {selectedUser.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Management tabs navigation - fixed below header */}
                                    <div className="px-6 border-b border-gray-200 dark:border-gray-700 relative flex-shrink-0">
                                        <div className="flex">
                                            <button
                                                data-management-tab="announcements"
                                                onClick={() => handleManagementTabChange('announcements')}
                                                className={cn(
                                                    "px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                                    activeManagementTab === 'announcements'
                                                        ? "border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-400"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                )}
                                            >
                                                <div className="flex items-center space-x-1.5">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                    </svg>
                                                    <span>Announcements</span>
                                                </div>
                                            </button>
                                        </div>
                                        <div
                                            ref={tabIndicatorRef}
                                            className="absolute bottom-0 h-0.5 bg-violet-500 dark:bg-violet-400 transition-all duration-300 ease-in-out"
                                            style={{ left: '0px', width: '0px' }}
                                        />
                                    </div>

                                    {/* Scrollable content area */}
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
                                                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Announcement Permissions</h4>

                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedUserSettings.canAnnounce}
                                                                    onChange={() => toggleAnnouncePermission(selectedUserId)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                                                                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    {selectedUserSettings.canAnnounce ? 'Enabled' : 'Disabled'}
                                                                </span>
                                                            </label>
                                                        </div>

                                                        {selectedUserSettings.canAnnounce ? (
                                                            <div className="space-y-5">
                                                                <div>
                                                                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                                                        Who can this user send announcements to?
                                                                    </h5>

                                                                    <div className="grid grid-cols-3 gap-4">
                                                                        <label className={cn(
                                                                            "flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors",
                                                                            selectedUserSettings.announceScope === 'everyone'
                                                                                ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30 dark:border-violet-700"
                                                                                : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:hover:bg-gray-750"
                                                                        )}>
                                                                            <input
                                                                                type="radio"
                                                                                name="announceScope"
                                                                                value="everyone"
                                                                                checked={selectedUserSettings.announceScope === 'everyone'}
                                                                                onChange={() => updateAnnounceScope(selectedUserId, 'everyone')}
                                                                                className="sr-only"
                                                                            />
                                                                            <svg className={cn(
                                                                                "w-6 h-6 mb-2",
                                                                                selectedUserSettings.announceScope === 'everyone' ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"
                                                                            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 12L14 17.5M8.5 17.5L14 12" transform="translate(11.5 14.75) scale(0.75)" />
                                                                            </svg>
                                                                            <span className={cn(
                                                                                "font-medium text-center",
                                                                                selectedUserSettings.announceScope === 'everyone' ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-300"
                                                                            )}>Everyone</span>
                                                                            <span className={cn(
                                                                                "text-xs text-center mt-1",
                                                                                selectedUserSettings.announceScope === 'everyone' ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"
                                                                            )}>Broadcast to all users</span>
                                                                        </label>

                                                                        <label className={cn(
                                                                            "flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors",
                                                                            selectedUserSettings.announceScope === 'groups'
                                                                                ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30 dark:border-violet-700"
                                                                                : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:hover:bg-gray-750"
                                                                        )}>
                                                                            <input
                                                                                type="radio"
                                                                                name="announceScope"
                                                                                value="groups"
                                                                                checked={selectedUserSettings.announceScope === 'groups'}
                                                                                onChange={() => updateAnnounceScope(selectedUserId, 'groups')}
                                                                                className="sr-only"
                                                                            />
                                                                            <svg className={cn(
                                                                                "w-6 h-6 mb-2",
                                                                                selectedUserSettings.announceScope === 'groups' ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"
                                                                            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            </svg>
                                                                            <span className={cn(
                                                                                "font-medium text-center",
                                                                                selectedUserSettings.announceScope === 'groups' ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-300"
                                                                            )}>Specific Groups</span>
                                                                            <span className={cn(
                                                                                "text-xs text-center mt-1",
                                                                                selectedUserSettings.announceScope === 'groups' ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"
                                                                            )}>Send to selected groups</span>
                                                                        </label>

                                                                        <label className={cn(
                                                                            "flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors",
                                                                            selectedUserSettings.announceScope === 'users'
                                                                                ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30 dark:border-violet-700"
                                                                                : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:hover:bg-gray-750"
                                                                        )}>
                                                                            <input
                                                                                type="radio"
                                                                                name="announceScope"
                                                                                value="users"
                                                                                checked={selectedUserSettings.announceScope === 'users'}
                                                                                onChange={() => updateAnnounceScope(selectedUserId, 'users')}
                                                                                className="sr-only"
                                                                            />
                                                                            <svg className={cn(
                                                                                "w-6 h-6 mb-2",
                                                                                selectedUserSettings.announceScope === 'users' ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"
                                                                            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                            </svg>
                                                                            <span className={cn(
                                                                                "font-medium text-center",
                                                                                selectedUserSettings.announceScope === 'users' ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-300"
                                                                            )}>Individual Users</span>
                                                                            <span className={cn(
                                                                                "text-xs text-center mt-1",
                                                                                selectedUserSettings.announceScope === 'users' ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"
                                                                            )}>Select specific users</span>
                                                                        </label>
                                                                    </div>
                                                                </div>

                                                                {/* Groups selection */}
                                                                <AnimatePresence>
                                                                    {selectedUserSettings.announceScope === 'groups' && (
                                                                        <motion.div
                                                                            className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 shadow-sm"
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: 10 }}
                                                                            transition={{ duration: 0.2 }}
                                                                        >
                                                                            <div className="mb-3 flex items-center justify-between">
                                                                                <h5 className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                                    Select Groups
                                                                                </h5>
                                                                                <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full">
                                                                                    {selectedUserSettings.selectedGroups.length} selected
                                                                                </span>
                                                                            </div>

                                                                            {availableGroups.length === 0 ? (
                                                                                <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                                                                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    </svg>
                                                                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No groups found</p>
                                                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                                                                                        Groups need to be created before they can be selected for announcements
                                                                                    </p>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                                                                                    {availableGroups.map((group) => (
                                                                                        <div
                                                                                            key={group.group_id}
                                                                                            className={cn(
                                                                                                "flex items-center p-3 rounded-md cursor-pointer transition-colors",
                                                                                                selectedUserSettings.selectedGroups.includes(group.group_id)
                                                                                                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50"
                                                                                                    : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800/30"
                                                                                            )}
                                                                                            onClick={() => toggleGroup(selectedUserId, group.group_id)}
                                                                                        >
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={selectedUserSettings.selectedGroups.includes(group.group_id)}
                                                                                                onChange={() => { }}
                                                                                                className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                                                                            />
                                                                                            <div className="flex items-center ml-3 flex-1">
                                                                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium mr-2">
                                                                                                    {group.name.substring(0, 2).toUpperCase()}
                                                                                                </div>
                                                                                                <span className="font-medium truncate">{group.name}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>

                                                                {/* Users selection */}
                                                                <AnimatePresence>
                                                                    {selectedUserSettings.announceScope === 'users' && (
                                                                        <motion.div
                                                                            className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 shadow-sm"
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: 10 }}
                                                                            transition={{ duration: 0.2 }}
                                                                        >
                                                                            <div className="mb-3 flex items-center justify-between">
                                                                                <h5 className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                                    Select Users
                                                                                </h5>
                                                                                <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full">
                                                                                    {selectedUserSettings.selectedUsers.length} selected
                                                                                </span>
                                                                            </div>

                                                                            {availableUsers.length === 0 ? (
                                                                                <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                                                                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                    </svg>
                                                                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                                                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                                                                                        Users need to be added before they can be selected for announcements
                                                                                    </p>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                                                                                    {availableUsers.map((targetUser) => (
                                                                                        <div
                                                                                            key={targetUser.user_id}
                                                                                            className={cn(
                                                                                                "flex items-center p-3 rounded-md cursor-pointer transition-colors",
                                                                                                selectedUserSettings.selectedUsers.includes(targetUser.user_id)
                                                                                                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50"
                                                                                                    : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800/30"
                                                                                            )}
                                                                                            onClick={() => toggleUser(selectedUserId, targetUser.user_id)}
                                                                                        >
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={selectedUserSettings.selectedUsers.includes(targetUser.user_id)}
                                                                                                onChange={() => { }}
                                                                                                className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                                                                            />
                                                                                            <div className="flex items-center ml-3">
                                                                                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-medium mr-2">
                                                                                                    {targetUser.profile_picture ? (
                                                                                                        <img
                                                                                                            src={targetUser.profile_picture}
                                                                                                            alt={`${targetUser.name}'s profile`}
                                                                                                            className="w-8 h-8 rounded-full object-cover"
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <span className="text-sm font-medium">
                                                                                                            {targetUser.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                <span className="font-medium truncate">{targetUser.name}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>

                                                                {/* Helpful reminder */}
                                                                <AnimatePresence>
                                                                    {selectedUserSettings.announceScope === 'everyone' && (
                                                                        <motion.div
                                                                            className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md border border-blue-100 dark:border-blue-800/30"
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: 10 }}
                                                                            transition={{ duration: 0.2 }}
                                                                        >
                                                                            <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            <div>
                                                                                <p className="font-medium text-sm">Broadcast Permission</p>
                                                                                <p className="text-sm mt-1">
                                                                                    This user will be able to send announcements to all users in the system.
                                                                                    Ensure this permission is granted only to users who need to make organization-wide announcements.
                                                                                </p>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center p-4 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 rounded-md border border-amber-100 dark:border-amber-900/30">
                                                                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                <span>This user does not have announcement permissions. Enable the toggle to configure announcement settings.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Fixed footer with actions - always visible */}
                                    <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md mr-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveChanges}
                                            disabled={loading}
                                            className={cn(
                                                "px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 transition-colors",
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
                                    <svg className="h-20 w-20 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            </motion.div>
        </motion.div>
    );
}