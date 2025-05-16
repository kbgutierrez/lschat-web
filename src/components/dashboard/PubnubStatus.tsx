'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface PubnubStatusProps {
  isConnected: boolean;
  channelId: string | null;
  lastMessage?: any;
  className?: string;
}

export const PubnubStatus = memo(function PubnubStatus({
  isConnected,
  channelId,
  lastMessage,
  className
}: PubnubStatusProps) {
  const [statusText, setStatusText] = useState('');
  const [showStatus, setShowStatus] = useState(true);
  const [isStable, setIsStable] = useState(false);
  
  // Use refs to track state without causing re-renders
  const lastStatusRef = useRef({ isConnected, channelId });
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimeRef = useRef<number>(0);
  
  // Use a more resilient connection state handler with hysteresis
  useEffect(() => {
    // Clear any existing timers
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    // Handle status text and display logic
    if (!channelId) {
      setStatusText('No channel selected');
      setIsStable(false);
      setShowStatus(false);
      return;
    }
    
    // Check if this is a new channel selection
    const channelChanged = channelId !== lastStatusRef.current.channelId;
    if (channelChanged) {
      setShowStatus(true);
      setIsStable(false);
      setStatusText('Connecting to chat...');
      lastStatusRef.current.channelId = channelId;
    }
    
    // Handle connection state changes
    if (isConnected !== lastStatusRef.current.isConnected) {
      lastStatusRef.current.isConnected = isConnected;
      
      if (isConnected) {
        setStatusText('Connected');
        setShowStatus(true);
        
        // Wait longer before considering connection stable
        connectionTimeoutRef.current = setTimeout(() => {
          setIsStable(true);
          
          // Hide status after showing "connected" briefly, if no errors
          hideTimeoutRef.current = setTimeout(() => {
            setShowStatus(false);
          }, 2000);
        }, 3000);
      } else {
        setStatusText('Connecting...');
        setIsStable(false);
        setShowStatus(true);
      }
    }
  }, [isConnected, channelId]);
  
  // Show brief notification on new messages, but not too frequently
  useEffect(() => {
    if (!lastMessage || !isStable) return;
    
    const now = Date.now();
    // Only show notification if it's been at least 5 seconds since last one
    if (now - messageTimeRef.current > 5000) {
      messageTimeRef.current = now;
      
      // Only briefly show message notification
      setStatusText('New message received');
      setShowStatus(true);
      
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      hideTimeoutRef.current = setTimeout(() => {
        setShowStatus(false);
      }, 1500);
    }
  }, [lastMessage, isStable]);
  
  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);
  
  if (!showStatus) return null;
  
  return (
    <></>
    // <div 
    //   className={cn(
    //     "px-3 py-1 rounded-full text-xs font-medium transition-all duration-300",
    //     isConnected && isStable
    //       ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    //       : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    //     isConnected && !isStable ? "animate-pulse" : "",
    //     className
    //   )}
    // >
    //   <span className="flex items-center gap-1.5">
    //     <span className={cn(
    //       "w-2 h-2 rounded-full transition-colors duration-500",
    //       isConnected && isStable 
    //         ? "bg-green-500 dark:bg-green-400" 
    //         : "bg-yellow-500 dark:bg-yellow-400"
    //     )}></span>
    //     {statusText}
    //   </span>
    // </div>
  );
});
