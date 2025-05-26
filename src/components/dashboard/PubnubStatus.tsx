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
  
  const lastStatusRef = useRef({ isConnected, channelId });
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    if (!channelId) {
      setStatusText('No channel selected');
      setIsStable(false);
      setShowStatus(false);
      return;
    }
    
    const channelChanged = channelId !== lastStatusRef.current.channelId;
    if (channelChanged) {
      setShowStatus(true);
      setIsStable(false);
      setStatusText('Connecting to chat...');
      lastStatusRef.current.channelId = channelId;
    }
    
    if (isConnected !== lastStatusRef.current.isConnected) {
      lastStatusRef.current.isConnected = isConnected;
      
      if (isConnected) {
        setStatusText('Connected');
        setShowStatus(true);
        
        connectionTimeoutRef.current = setTimeout(() => {
          setIsStable(true);
          
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
  
  useEffect(() => {
    if (!lastMessage || !isStable) return;
    
    const now = Date.now();
    if (now - messageTimeRef.current > 5000) {
      messageTimeRef.current = now;
      
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
  
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);
  
  if (!showStatus) return null;
  
  return <></>;
});
