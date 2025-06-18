'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, useAnimation } from "framer-motion";
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
  initialPosition?: { x: number; y: number } | null;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

const SpeedDial: React.FC<SpeedDialProps> = ({ 
  actions,
  initialPosition = null,
  onPositionChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const tooltipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const controls = useAnimation();
  
  const filteredActions = actions.filter(action => action.show !== false);
  
  if (filteredActions.length === 0) return null;

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, filteredActions.length);
    tooltipRefs.current = tooltipRefs.current.slice(0, filteredActions.length);
  }, [filteredActions.length]);

  // Set bounds based on screen size
  useEffect(() => {
    const updateBounds = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      setBounds({
        left: -30, // Allow slight overflow for collapsed state
        top: -windowHeight + 100, // Allow some space from top
        right: windowWidth - 80, // Keep within right edge
        bottom: 0
      });
    };
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);
  
  // Load saved position
  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    const savedPosition = localStorage.getItem('speedDialPosition');
    
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Validate position is within screen bounds
        if (pos.x >= -30 && pos.x < windowWidth - 80 && 
            pos.y > -windowHeight + 100 && pos.y <= 0) {
          setPosition(pos);
          
          // Check if it should be collapsed (near left edge)
          if (pos.x <= -20) {
            setIsCollapsed(true);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved position:', e);
      }
    }
    
    setIsInitialized(true);
    return () => clearTimeout(readyTimer);
  }, []);
  
  // Handle animations and state when position changes
  useEffect(() => {
    // Don't animate during initialization
    if (!isInitialized) return;
    
    // Save position to localStorage
    localStorage.setItem('speedDialPosition', JSON.stringify(position));
    
    // Notify parent if needed
    if (onPositionChange) {
      onPositionChange(position);
    }
    
    // Animate to the new position
    controls.start({
      x: position.x,
      y: position.y,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    });
  }, [position, isInitialized, onPositionChange, controls]);
  
  // Animation for opening/closing the speed dial
  useEffect(() => {
    // Check if the button arrays exist and have elements before animating
    const hasActionButtons = buttonRefs.current && buttonRefs.current.length > 0 && 
      buttonRefs.current.some(btn => btn !== null);
    const hasTooltips = tooltipRefs.current && tooltipRefs.current.length > 0 && 
      tooltipRefs.current.some(tip => tip !== null);
    
    if (isOpen) {
      // Only rotate the button when not collapsed
      if (!isCollapsed && mainButtonRef.current) {
        gsap.to(mainButtonRef.current, {
          rotation: 45,
          duration: 0.4,
          ease: Power3.easeOut
        });
      }
      
      if (hasActionButtons) {
        gsap.fromTo(
          buttonRefs.current.filter(Boolean),
          { y: 20, scale: 0.8, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, stagger: 0.08, duration: 0.5, ease: Elastic.easeOut.config(1, 0.5) }
        );
      }
      
      if (hasTooltips) {
        gsap.fromTo(
          tooltipRefs.current.filter(Boolean),
          { opacity: 0, x: -5 },
          { opacity: 1, x: 0, stagger: 0.08, duration: 0.5, ease: Power3.easeOut, delay: 0.1 }
        );
      }
    } else {
      // Reset rotation if not collapsed
      if (!isCollapsed && mainButtonRef.current) {
        gsap.to(mainButtonRef.current, {
          rotation: 0,
          duration: 0.4,
          ease: Power3.easeOut
        });
      }
      
      if (hasTooltips) {
        gsap.to(tooltipRefs.current.filter(Boolean), {
          opacity: 0,
          x: -5,
          duration: 0.2,
        });
      }
      
      if (hasActionButtons) {
        gsap.to(buttonRefs.current.filter(Boolean), {
          y: 20,
          opacity: 0,
          scale: 0.8,
          stagger: { from: "end", each: 0.05 },
          duration: 0.3,
          delay: 0.1
        });
      }
    }
  }, [isOpen, isCollapsed]);

  const handleButtonHover = (index: number, isEnter: boolean) => {
    if (!buttonRefs.current[index]) return;
    
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

  const handleMainButtonHover = (isEnter: boolean) => {
    if (!mainButtonRef.current || isCollapsed) return; // Add isCollapsed check to prevent hover effects when collapsed
    
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

  const handleDragEnd = (_e: any, info: { offset: { x: number, y: number }, point: { x: number, y: number } }) => {
    const edgeSnapThreshold = 20;
    const newX = position.x + info.offset.x;
    const newY = position.y + info.offset.y;
    
    // Check if near left edge to collapse
    if (newX <= edgeSnapThreshold) {
      setIsCollapsed(true);
      // Position at exactly -24px to show half of the 48px button
      setPosition({ x: -24, y: newY });
    } else {
      setIsCollapsed(false);
      setPosition({ x: newX, y: newY });
    }
  };

  const resetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition({ x: 20, y: -100 });
    setIsCollapsed(false);
    localStorage.removeItem('speedDialPosition');
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
    
    if (isOpen) setIsOpen(false);
    
    if (!isCollapsed) {
      // Position at exactly -24px to show half of the 48px button
      setPosition(prev => ({ ...prev, x: -24 }));
    } else {
      setPosition(prev => ({ ...prev, x: 30 }));
    }
  };

  const handleMainButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isReady) {
      setIsReady(true);
      setTimeout(() => {
        setIsOpen(true);
      }, 50);
      return;
    }
    
    if (isCollapsed) {
      // First uncollapse without changing isOpen state
      setIsCollapsed(false);
      setPosition(prev => ({ ...prev, x: 30 }));
      // Explicitly ensure the button is not rotated
      if (mainButtonRef.current) {
        gsap.to(mainButtonRef.current, {
          rotation: 0,
          duration: 0.2
        });
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="z-50 fixed bottom-6"
      animate={controls}
      initial={{ x: position.x, y: position.y }}
      drag={!isCollapsed}
      dragMomentum={false}
      dragConstraints={bounds}
      onDragEnd={handleDragEnd}
      style={{ touchAction: "none" }}
    >
      <div className="relative">
        <button
          ref={mainButtonRef}
          onClick={handleMainButtonClick}
          onMouseEnter={() => handleMainButtonHover(true)}
          onMouseLeave={() => handleMainButtonHover(false)}
          className={cn(
            "cursor-pointer w-12 h-12 rounded-full shadow-lg flex items-center justify-center",
            "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
            "transition-all duration-200 active:scale-95",
            isCollapsed ? "collapsed-button" : "expandable-button" // Add distinct class when not collapsed
          )}
          style={{ 
            WebkitTapHighlightColor: "transparent",
            cursor: "pointer",
            transform: isCollapsed ? "translateX(50%)" : "none"  
          }}
        >
          <svg 
            className={cn("w-10 h-10 transition-transform", isCollapsed ? "translate-x-1" : "")} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ pointerEvents: 'none' }} /* Add this to prevent SVG from capturing clicks */
          >
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            )}
          </svg>
        </button>

        {!isCollapsed && (
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
                    "cursor-pointer w-12 h-12 rounded-full flex items-center justify-center shadow-md",
                    action.bgColor || "bg-white dark:bg-gray-700",
                    action.color || "text-gray-700 dark:text-gray-200"
                  )}
                  style={{ opacity: 0 }}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>
                
                <span 
                  ref={(el) => { tooltipRefs.current[index] = el; }}
                  className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-sm rounded whitespace-nowrap pointer-events-none z-30 shadow-md"
                  style={{ opacity: 0 }} 
                >
                  {action.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isCollapsed && (
          <div className={cn(
            "cursor-pointer absolute -top-2 -right-2 flex space-x-1.5",
            isOpen ? "opacity-100" : "opacity-0",
            isOpen ? "visible" : "invisible",
            "z-60 transition-opacity duration-200" /* Added transition */
          )}>
            <button
              onClick={(e) => {
                e.stopPropagation(); /* Explicitly stop propagation */
                resetPosition(e);
              }}
              className="cursor-pointer bg-gray-800/80 hover:bg-gray-800 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              title="Reset position"
              style={{ pointerEvents: 'auto' }} /* Ensure clicks are captured */
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ pointerEvents: 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation(); /* Explicitly stop propagation */
                toggleCollapse(e);
              }}
              className="cursor-pointer bg-gray-800/80 hover:bg-gray-800 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              title="Hide to edge"
              style={{ pointerEvents: 'auto' }} /* Ensure clicks are captured */
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ pointerEvents: 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      <div className={cn(
        "mt-1 text-xs text-center text-gray-500 dark:text-gray-400 opacity-80 select-none",
        !isOpen || isCollapsed ? "hidden" : "block"
      )}>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">Drag to move</span>
      </div>

      {isOpen && !isCollapsed && (
        <div 
          className="fixed inset-0 z-10" /* Lower z-index to stay below buttons */
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <style jsx global>{`
        .collapsed-button {
          box-shadow: 0 0 12px rgba(124, 58, 237, 0.8), 0 0 20px rgba(124, 58, 237, 0.4);
          border-right: 3px solid rgba(255, 255, 255, 0.8);
          animation: button-pulse 2s infinite ease-in-out;
        }
        
        @keyframes button-pulse {
          0% { box-shadow: 0 0 12px rgba(124, 58, 237, 0.8), 0 0 20px rgba(124, 58, 237, 0.4); opacity: 0.9; }
          50% { box-shadow: 0 0 16px rgba(124, 58, 237, 0.9), 0 0 30px rgba(124, 58, 237, 0.6); opacity: 1; }
          100% { box-shadow: 0 0 12px rgba(124, 58, 237, 0.8), 0 0 20px rgba(124, 58, 237, 0.4); opacity: 0.9; }
        }
        
        /* Add this to ensure buttons are clickable */
        .z-60 {
          z-index: 60;
        }
        
        /* Make sure SVGs don't capture clicks */
        .z-60 svg {
          pointer-events: none;
        }
        
        /* Add specific style to prevent hover effects on collapsed button */
        .collapsed-button:hover {
          transform: translateX(50%) !important; /* Maintain half-visible state even on hover */
        }
        
        /* Standard hover behavior only applies to expandable button */
        .expandable-button:hover {
          transform: scale(1.05);
        }
      `}</style>
    </motion.div>
  );
};

export default SpeedDial;