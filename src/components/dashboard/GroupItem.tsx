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
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export const GroupItem: React.FC<GroupItemProps> = ({ 
  group, 
  isSelected,
  onSelect
}) => {
  return (
    <button
      className={cn(
        "w-full flex items-center p-3 rounded-lg transition-colors duration-200 mb-1",
        isSelected
          ? "bg-white/20 dark:bg-violet-900/30" 
          : "hover:bg-white/10 dark:hover:bg-gray-800/50"
      )}
      onClick={() => onSelect(group.group_id)}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500">
          <span className="text-base font-medium text-white">{getInitials(group.name)}</span>
        </div>
      </div>
      
      <div className="ml-3 flex-1 flex flex-col items-start text-left overflow-hidden">
        <div className="flex items-center justify-between w-full">
          <span className="font-medium text-white dark:text-white truncate">
            {group.name}
            {group.role === 'admin' && (
              <span className="ml-1 text-xs bg-blue-600/30 dark:bg-blue-900/50 text-blue-100 dark:text-blue-300 px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
          </span>
          <span className="text-xs text-white/70 dark:text-gray-400 ml-1 whitespace-nowrap">
            {group.lastMessageTime || new Date(group.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center justify-between w-full mt-1">
          <span className="text-sm text-white/70 dark:text-gray-400 truncate max-w-[95%]">
            {group.lastMessage || group.description || 'No description'}
          </span>
        </div>
      </div>
    </button>
  );
};
