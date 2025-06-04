'use client'
import React, { useState, useEffect, useRef } from 'react';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (groupName: string, groupDescription: string) => Promise<void>;
}

export default function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setGroupDescription('');
      setIsCreating(false);
      setError(null);
      setShowConfirmation(false);
      
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    // Instead of creating immediately, show confirmation
    setShowConfirmation(true);
  };
  
  const handleConfirmCreate = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      await onCreate(groupName.trim(), groupDescription.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      setIsCreating(false);
      setShowConfirmation(false);
    }
  };
  
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {showConfirmation ? 'Confirm Group Creation' : 'Create New Group'}
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

        {!showConfirmation ? (
          <form onSubmit={handleSubmit} className="p-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800/30">
                <p>{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Name*
              </label>
              <input
                id="groupName"
                ref={nameInputRef}
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter group name"
                maxLength={50}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {groupName.length}/50 characters
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="What's this group about?"
                maxLength={200}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {groupDescription.length}/200 characters
              </p>
            </div>

            <div className="mt-5 sm:mt-6 flex flex-row-reverse">
              <button
                type="submit"
                disabled={!groupName.trim()}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed ml-3"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 rounded-md border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800/30">
                <p>{error}</p>
              </div>
            )}
            
            <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 rounded-lg">
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</span>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{groupName}</p>
                </div>
                
                {groupDescription && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</span>
                    <p className="text-gray-800 dark:text-gray-200">{groupDescription}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 bg-white/60 dark:bg-gray-800/50 p-3 rounded border border-violet-100 dark:border-violet-900/20 flex items-center">
                <svg className="w-5 h-5 text-violet-600 dark:text-violet-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  A unique channel will be created for this group. You'll be added as the admin.
                </span>
              </div>
            </div>

            <div className="flex flex-row-reverse">
              <button
                onClick={handleConfirmCreate}
                disabled={isCreating}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed ml-3"
              >
                {isCreating ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </div>
                ) : "Create Group"}
              </button>
              <button
                type="button"
                onClick={handleCancelConfirmation}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 rounded-md border border-gray-300 dark:border-gray-600"
              >
                Back
              </button>
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
