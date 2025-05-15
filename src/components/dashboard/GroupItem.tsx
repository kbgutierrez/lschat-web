'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from './ContactItem';

export interface GroupData {
  id: string;
  name: string;
  members: string[];
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

interface GroupItemProps {
  group: GroupData;
  isActive: boolean;
  onClick: (id: string) => void;
isSelected?: boolean;
onSelect?: (id: string) => void;
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
      onClick={() => onClick(group.id)}
    >
      <div className="relative mr-3">
        <div className="w-12 h-12 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-lg font-bold">
          {getInitials(group.name)}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-gray-100 dark:bg-gray-800 border border-white dark:border-gray-900 rounded-full w-5 h-5 flex items-center justify-center text-xs text-gray-700 dark:text-gray-400">
          {group.members.length}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{group.name}</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-1">
            {group.lastMessageTime}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {group.lastMessage}
        </p>
      </div>
      
      {group.unread > 0 && (
        <div className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {group.unread > 9 ? '9+' : group.unread}
        </div>
      )}
    </div>
  );
};
