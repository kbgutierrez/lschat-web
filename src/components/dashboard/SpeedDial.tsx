'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SpeedDialAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
  bgColor?: string;
  show?: boolean;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
}

const SpeedDial: React.FC<SpeedDialProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);

  const filteredActions = actions.filter(action => action.show !== false);
  
  if (filteredActions.length === 0) return null;

  return (
    <div className="relative z-20">
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-xl",
          isOpen && "rotate-45"
        )}
        aria-label="Actions menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Action buttons */}
      <div className={cn(
        "absolute bottom-16 space-y-3 transition-all duration-300 z-30",
        isOpen ? "opacity-100 transform translate-y-0" : "opacity-0 pointer-events-none transform translate-y-4"
      )}>
        {filteredActions.map((action, index) => (
          <div key={index} className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-md",
                "transition-all duration-300 transform hover:scale-110",
                action.bgColor || "bg-white dark:bg-gray-700",
                action.color || "text-gray-700 dark:text-gray-200"
              )}
              aria-label={action.label}
            >
              {action.icon}
            </button>
            
            {/* Label tooltip */}
            <span className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 
                        text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
              {action.label}
            </span>
          </div>
        ))}
      </div>

      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default SpeedDial;
