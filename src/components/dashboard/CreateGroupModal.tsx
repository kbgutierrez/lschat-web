'use client'
import React, {useState, useEffect} from 'react'

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupName: string, groupDescription: string) => void;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreate
}: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (groupName.trim()) {
            onCreate(groupName, groupDescription);
            setGroupName('');
            setGroupDescription('');
        }
    };

    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg className="mr-2 h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Create New Group
                </h2>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-400"
                    aria-label="Close"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="groupName">
                        Group Name
                    </label>
                    <input
                        type="text"
                        id="groupName"
                        className="w-full rounded border border-gray-300 p-2.5 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-violet-400"
                        placeholder="Enter group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                    />
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="groupDescription">
                        Description
                    </label>
                    <textarea
                        id="groupDescription"
                        rows={4}
                        maxLength={300}
                        className="w-full rounded border border-gray-300 p-2.5 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-violet-400"
                        placeholder="Enter group description"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                    ></textarea>
                    <div className="mt-1 text-sm text-gray-500 text-right">
                        {groupDescription.length}/300
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-md bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                    >
                        Create Group
                    </button>
                </div>
            </form>
        </div>
    </div>
  )
}
