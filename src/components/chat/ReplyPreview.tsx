import React from 'react';
import { cn } from '@/lib/utils';

type ReplyPreviewProps = {
  senderName: string;
  message: string;
  isOwn?: boolean;
  onClick?: () => void;
};

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ 
  senderName, 
  message,
  isOwn,
  onClick
}) => {
  const truncatedMessage = message.length > 60 
    ? `${message.substring(0, 60)}...` 
    : message;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-md text-sm mb-1 border-l-2 w-100 max-w-[95%] cursor-pointer",
        isOwn 
          ? "bg-violet-100/50 dark:bg-violet-900/20 border-violet-400 dark:border-violet-600" 
          : "bg-gray-100/70 dark:bg-gray-800/50 border-gray-400 dark:border-gray-600",
        onClick && "cursor-pointer hover:bg-opacity-80"
      )}
    >
      <div className="font-medium text-xs text-gray-700 dark:text-gray-300">
        {isOwn ? "You" : senderName}
      </div>
      <div className="text-gray-600 dark:text-gray-400 break-words">
        {truncatedMessage}
      </div>
    </div>
  );
};