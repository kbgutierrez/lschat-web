'use client';

import React, { useRef, useState, useEffect } from 'react';
import { User } from '@/lib/clientUtils';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative border-l border-violet-100 dark:border-gray-800 pl-3" ref={menuRef}>
      <div className="flex items-center">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center space-x-2 hover:bg-violet-50 dark:hover:bg-gray-800/50 py-1.5 px-2 rounded-lg group"
        >
          <div className="relative w-8 h-8 rounded-full bg-violet-500 text-white overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium select-none" style={{ lineHeight: 1 }}>
                {user.firstName?.charAt(0).toUpperCase() || user.first_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white text-left group-hover:text-black dark:group-hover:text-violet-400 transition-colors">
              {user.firstName || user.first_name}
            </p>
          </div>
          <svg className="h-4 w-4 text-black dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 z-50 border border-violet-100 dark:border-gray-700 animate-fade-in-up">
            <div className="px-4 py-2 border-b border-violet-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName || user.first_name} {user.lastName || user.last_name}
              </p>
              <p className="text-xs text-black dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
            <a href="#" onClick={()=>{alert('')}} className="block px-4 py-2 text-sm text-black dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-gray-800">
              Your Profile
            </a>
            <a href="#" className="block px-4 py-2 text-sm text-black dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-gray-800">
              Settings
            </a>
            <button
              onClick={onLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-violet-100 dark:hover:bg-gray-800 border-t border-violet-100 dark:border-gray-700"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
