'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
// Import GSAP
import gsap from 'gsap';
import { Elastic, Power3 } from 'gsap';

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
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const tooltipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  
  // Filter out actions that shouldn't be shown
  const filteredActions = actions.filter(action => action.show !== false);
  
  if (filteredActions.length === 0) return null;
  
  // Initialize buttonRefs array with the right size
  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, filteredActions.length);
    tooltipRefs.current = tooltipRefs.current.slice(0, filteredActions.length);
  }, [filteredActions.length]);
  
  // Use GSAP to animate the buttons when isOpen changes
  useEffect(() => {
    if (!buttonRefs.current.length) return;
    
    if (isOpen) {
      // Main button rotation animation
      gsap.to(mainButtonRef.current, {
        rotation: 45,
        duration: 0.4,
        ease: Power3.easeOut
      });
      
      // Staggered animation for action buttons and their tooltips
      gsap.fromTo(
        buttonRefs.current,
        {
          y: 20,
          scale: 0.8,
          opacity: 0
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: Elastic.easeOut.config(1, 0.5),
        }
      );
      
      // Animate tooltips to appear with the buttons
      gsap.fromTo(
        tooltipRefs.current,
        {
          opacity: 0,
          x: -5,
        },
        {
          opacity: 1,
          x: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: Power3.easeOut,
          delay: 0.1
        }
      );
    } else {
      // Main button rotation animation (back to 0)
      gsap.to(mainButtonRef.current, {
        rotation: 0,
        duration: 0.4,
        ease: Power3.easeOut
      });
      
      // Hide tooltips first
      gsap.to(tooltipRefs.current, {
        opacity: 0,
        x: -5,
        duration: 0.2,
      });
      
      // Then collapse action buttons
      gsap.to(buttonRefs.current, {
        y: 20,
        opacity: 0,
        scale: 0.8,
        stagger: {
          from: "end",
          each: 0.05
        },
        duration: 0.3,
        delay: 0.1
      });
    }
  }, [isOpen]);
  
  // Handle hover animations for buttons (without tooltip changes)
  const handleButtonHover = (index: number, isEnter: boolean) => {
    if (isEnter) {
      gsap.to(buttonRefs.current[index], {
        scale: 1.15,
        duration: 0.3,
        ease: Power3.easeOut
      });
    } else {
      gsap.to(buttonRefs.current[index], {
        scale: 1,
        duration: 0.3,
        ease: Power3.easeOut
      });
    }
  };

  // Add bounce animation for main button
  const handleMainButtonHover = (isEnter: boolean) => {
    if (isEnter) {
      gsap.to(mainButtonRef.current, {
        scale: 1.1,
        boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)",
        duration: 0.3
      });
    } else {
      gsap.to(mainButtonRef.current, {
        scale: 1,
        boxShadow: "0 4px 6px -1px rgba(124, 58, 237, 0.3)",
        duration: 0.3
      });
    }
  };

  return (
    <div className="relative z-20">
      {/* Main button */}
      <button
        ref={mainButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => handleMainButtonHover(true)}
        onMouseLeave={() => handleMainButtonHover(false)}
        className={cn(
          "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200",
          "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
        )}
        aria-label="Actions menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Action buttons - Using visibility for GSAP animations */}
      <div className={cn(
        "absolute bottom-16 space-y-3 z-30",
        isOpen ? "visible" : "invisible pointer-events-none"
      )}>
        {filteredActions.map((action, index) => (
          <div key={index} className="relative">
            <button
              ref={(el) => { buttonRefs.current[index] = el; }}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                setIsOpen(false);
              }}
              onMouseEnter={() => handleButtonHover(index, true)}
              onMouseLeave={() => handleButtonHover(index, false)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-md",
                action.bgColor || "bg-white dark:bg-gray-700",
                action.color || "text-gray-700 dark:text-gray-200"
              )}
              style={{ opacity: 0 }} // Initial state for GSAP
              aria-label={action.label}
            >
              {action.icon}
            </button>
            
            {/* Label tooltip - Always visible when menu is open */}
            <span 
              ref={(el) => { tooltipRefs.current[index] = el; }}
              className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 
                        text-sm rounded whitespace-nowrap pointer-events-none z-30 shadow-md"
              style={{ opacity: 0 }} 
            >
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
