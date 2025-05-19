'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from './ContactItem';

export interface GroupData {
  group_id: number;
  name: string;
  description: string;
  pubnub_channel: string;
  role: string;
  created_at: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface GroupItemProps {
  group: GroupData;
  isActive: boolean;
  onClick: (id: number) => void;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
}

export const GroupItem: React.FC<GroupItemProps> = ({ 
  group, 
  isActive, 
  onClick 
}) => {
  return (
    <div
      className={cn(
        "flex items-center p-3 cursor-pointer transition-colors",
        isActive ? "bg-violet-100 dark:bg-gray-800" : "hover:bg-violet-50 dark:hover:bg-gray-800/50"
      )}
      onClick={() => onClick(group.group_id)}
    >
      <div className="relative mr-3">
        <div className="w-12 h-12 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-lg font-bold">
          {getInitials(group.name)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {group.name}
            {group.role === 'admin' && (
              <span className="ml-1 text-xs bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-300 px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-1">
            {group.lastMessageTime || new Date(group.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {group.lastMessage || group.description || 'No description'}
        </p>
      </div>
    </div>
  );
};
