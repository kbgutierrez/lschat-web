'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Draggable from 'react-draggable';
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
  const nodeRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  
  const filteredActions = actions.filter(action => action.show !== false);
  
  if (filteredActions.length === 0) return null;

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, filteredActions.length);
    tooltipRefs.current = tooltipRefs.current.slice(0, filteredActions.length);
  }, [filteredActions.length]);

  useEffect(() => {
    const updateBounds = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      setBounds({
        left: 0,
        top: -windowHeight + 100,
        right: windowWidth - 80,
        bottom: 0
      });
    };
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    
    return () => {
      window.removeEventListener('resize', updateBounds);
    };
  }, []);
  
  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setIsReady(true);
      console.log('SpeedDial ready for interactions');
    }, 100);
    
    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    const savedPosition = localStorage.getItem('speedDialPosition');
    
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (pos.x >= 0 && pos.x < windowWidth - 80 && 
            pos.y > -windowHeight + 100 && pos.y < 0) {
          setPosition(pos);
          
          if (pos.x <= 20 && (pos.x !== 0 || pos.y !== 0)) {
            setIsCollapsed(true);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved position:', e);
      }
    }
    
    setIsInitialized(true);
  }, []);
  
  useEffect(() => {
    if (!isInitialized) return;
    
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('speedDialPosition', JSON.stringify(position));
      if (onPositionChange) {
        onPositionChange(position);
      }
    }
  }, [position, onPositionChange, isInitialized]);
  
  useEffect(() => {
    if (!buttonRefs.current.length || isCollapsed) return;
    
    if (isOpen) {
      gsap.to(mainButtonRef.current, {
        rotation: 45,
        duration: 0.4,
        ease: Power3.easeOut
      });
      
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
      gsap.to(mainButtonRef.current, {
        rotation: 0,
        duration: 0.4,
        ease: Power3.easeOut
      });
      
      gsap.to(tooltipRefs.current, {
        opacity: 0,
        x: -5,
        duration: 0.2,
      });
      
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
  }, [isOpen, isCollapsed]);

  useEffect(() => {
    if (!containerRef.current || !mainButtonRef.current) return;
    
    if (isCollapsed) {
      gsap.to(containerRef.current, {
        x: '-60%',
        duration: 0.3,
        ease: "power2.out"
      });
      
      gsap.to(mainButtonRef.current, {
        backgroundColor: 'rgba(124, 58, 237, 0.95)',
        boxShadow: '0px 0px 12px rgba(124, 58, 237, 0.8)',
        borderRadius: '50% 50% 50% 50%', 
        scale: 1.05,
        duration: 0.3
      });
    } else {
      gsap.to(containerRef.current, {
        x: '0%',
        duration: 0.3,
        ease: "power2.out"
      });
      
      gsap.to(mainButtonRef.current, {
        backgroundColor: '',
        boxShadow: '',
        borderRadius: '',
        scale: 1,
        duration: 0.3
      });
    }
  }, [isCollapsed]);
  
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

  const handleMainButtonHover = (isEnter: boolean) => {
    if (!mainButtonRef.current) return;
    
    if (isEnter && !isCollapsed) {
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

  const handleDragStop = (_e: any, data: { x: number; y: number }) => {
    const edgeSnapThreshold = 30;
    const isAtDefaultPosition = data.x === 0 && data.y === 0;
    
    if (data.x <= edgeSnapThreshold && !isAtDefaultPosition) {
      setIsCollapsed(true);
      setPosition({ x: 0, y: data.y });
    } else {
      setIsCollapsed(false);
      setPosition({ x: data.x, y: data.y });
    }
  };

  const resetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition({ x: 0, y: 0 });
    setIsCollapsed(false);
    localStorage.removeItem('speedDialPosition');
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
    if (isOpen) {
      setIsOpen(false);
    }
    
    if (isCollapsed) {
      setPosition(prev => ({ ...prev, x: 30 }));
    } else {
      setPosition(prev => ({ ...prev, x: 0 }));
    }
  };

  const handleMainButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isReady) {
      console.log('SpeedDial not ready yet, initializing...');
      setIsReady(true);
      setTimeout(() => {
        setIsOpen(true);
      }, 50);
      return;
    }
    
    if (isCollapsed) {
      setIsCollapsed(false);
      setPosition(prev => ({ ...prev, x: 30 }));
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      bounds={bounds}
      onStop={handleDragStop}
      handle=".drag-handle"
      defaultClassNameDragging="dragging"
      defaultClassName="speed-dial-draggable"
      disabled={isCollapsed}
    >
      <div 
        ref={nodeRef}
        className={cn(
          "fixed bottom-6 left-0 z-50",
          isCollapsed ? "mobile-tab-docked" : ""
        )}
        style={{ touchAction: 'none' }}
      >
        <div
          ref={containerRef}
          className={cn(
            "relative z-20 transition-all duration-300",
            isCollapsed ? "mobile-tab-container" : ""
          )}
        >
          <button
            ref={mainButtonRef}
            onClick={handleMainButtonClick}
            onMouseEnter={() => handleMainButtonHover(true)}
            onMouseLeave={() => handleMainButtonHover(false)}
            className={cn(
              "w-12 h-12 rounded-full shadow-lg flex items-center justify-center",
              "transition-all duration-200 drag-handle active:scale-95",
              "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
              isCollapsed ? "mobile-tab" : ""
            )}
            aria-label={isCollapsed ? "Expand actions menu" : "Actions menu"}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              cursor: 'pointer'
            }}
          >
            <svg 
              className={cn("w-10 h-10 transition-transform", isCollapsed ? "rotate-360 ml-5" : "")} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
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
                      "w-12 h-12 rounded-full flex items-center justify-center shadow-md",
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
              "absolute -top-2 -right-2 flex space-x-1",
              isOpen ? "opacity-100" : "opacity-0",
              isOpen ? "visible" : "invisible"
            )}>
              <button
                onClick={resetPosition}
                className="bg-gray-800/70 hover:bg-gray-800/90 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                title="Reset position"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button
                onClick={toggleCollapse}
                className="bg-gray-800/70 hover:bg-gray-800/90 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                title="Hide to edge"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
        
        <style jsx global>{`
          .mobile-tab-docked {
            touch-action: none;
            pointer-events: auto !important;
            left: 0 !important;
          }
          
          .mobile-tab-container {
            will-change: transform;
            position: relative;
          }
          
          .mobile-tab {
            border-top-left-radius: 50%;
            border-bottom-left-radius: 50%;
            border-top-right-radius: 50%;
            border-bottom-right-radius: 50%;
            box-shadow: 0 0 12px rgba(124, 58, 237, 0.8), 0 0 20px rgba(124, 58, 237, 0.4);
            will-change: transform;
            position: relative;
            z-index: 60;
            border: 2px solid rgba(255, 255, 255, 0.6);
          }
          
          @keyframes tab-pulse {
            0% { transform: scale(1); box-shadow: 0 0 12px rgba(124, 58, 237, 0.8), 0 0 20px rgba(124, 58, 237, 0.4); }
            50% { transform: scale(1.1); box-shadow: 0 0 16px rgba(124, 58, 237, 0.9), 0 0 30px rgba(124, 58, 237, 0.6); }
            100% { transform: scale(1); box-shadow: 0 0 12px rgba(124, 58, 237, 0.8), 0 0 20px rgba(124, 58, 237, 0.4); }
          }
          
          .mobile-tab-docked .mobile-tab {
            animation: tab-pulse 2s infinite ease-in-out;
          }

          @media (max-width: 640px) {
            .mobile-tab-docked {
              bottom: 8rem;
            }
          }
          
          .speed-dial-draggable {
            position: fixed !important;
          }
          
          .drag-handle {
            -webkit-touch-callout: none;
          }

          .speed-dial-draggable button {
            -webkit-touch-callout: none;
            pointer-events: auto;
            -webkit-tap-highlight-color: transparent;
          }
          
          .mobile-tab {
            min-width: 24px !important;
          }
          
          @supports (-webkit-touch-callout: none) {
            .mobile-tab-docked {
              transform: translateX(0) !important;
            }
          }
          
          .speed-dial-draggable button:active {
            transform: scale(0.95);
          }
        `}</style>
      </div>
    </Draggable>
  );
};

export default SpeedDial;