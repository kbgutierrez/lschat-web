'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ContactListItem } from '@/lib/api';

interface ContactItemProps {
  contact: ContactListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const ContactItem: React.FC<ContactItemProps> = ({ contact, isSelected, onSelect }) => {
  return (
    <button
      className={cn(
        "w-full flex items-center p-3 rounded-lg transition-colors duration-200 mb-1",
        isSelected 
          ? "bg-white/20 dark:bg-violet-900/30" 
          : "hover:bg-white/10 dark:hover:bg-gray-800/50"
      )}
      onClick={() => onSelect(contact.contact_id.toString())}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500">
          <span className="text-base font-medium text-white">{getInitials(contact.contact_full_name)}</span>
        </div>
      </div>
      <div className="ml-3 flex-1 flex flex-col items-start text-left overflow-hidden">
        <div className="flex items-center justify-between w-full">
          <span className="font-medium text-white dark:text-white truncate">
            {contact.contact_full_name}
          </span>
        </div>
        <div className="flex items-center justify-between w-full mt-1">
          <span className="text-sm text-white/70 dark:text-gray-400 truncate max-w-[80%]">
            {contact.contact_mobile_number}
          </span>
        </div>
      </div>
    </button>
  );
};
