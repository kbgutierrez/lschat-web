'use client';

import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-violet-50 dark:bg-gray-950 p-4 text-center">
      <div className="w-20 h-20 bg-violet-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-violet-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-black dark:text-gray-200 mb-2">No conversation selected</h3>
      <p className="text-black dark:text-gray-400 max-w-sm">
        Select a conversation from the sidebar to start chatting, or create a new conversation with one of your contacts.
      </p>
    </div>
  );
};
