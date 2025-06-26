import React from 'react';

type ReplyingToPreviewProps = {
  senderName: string;
  message: string;
  onCancel: () => void;
};

export const ReplyingToPreview: React.FC<ReplyingToPreviewProps> = ({
  senderName,
  message,
  onCancel
}) => {
  // Truncate message if too long
  const truncatedMessage = message.length > 50 
    ? `${message.substring(0, 50)}...` 
    : message;

  return (
    <div className="flex items-center bg-violet-100 dark:bg-violet-900/30 p-2 rounded-t-lg border-b border-violet-200 dark:border-violet-700">
      <div className="flex-1 overflow-hidden">
        <div className="text-xs font-medium text-violet-800 dark:text-violet-300">
          Replying to {senderName}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
          {truncatedMessage}
        </div>
      </div>
      <button 
        onClick={onCancel}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};