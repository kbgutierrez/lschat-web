'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  autoHide?: boolean;
}

export function LoadingScreen({ 
  isLoading, 
  progress = 0, 
  message = "Loading",
  autoHide = false
}: LoadingScreenProps) {
  const [visible, setVisible] = useState(isLoading);
  
  // Auto-hide the loading screen after a few seconds if requested
  useEffect(() => {
    if (autoHide && isLoading) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    setVisible(isLoading);
  }, [isLoading, autoHide]);
  
  // Handle visibility separately from isLoading to allow for exit animations
  if (!visible) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-auth backdrop-blur-sm"
    >
      <div className="animate-bounce-subtle">
        <div className="bg-white/20 rounded-full p-5 backdrop-blur-sm">
          <Image 
            src="/images/lschat-logo.png" 
            alt="LS Chat Logo"
            width={200}
            height={200}
            priority
            className="drop-shadow-lg"
          />
        </div>
      </div>
      <h1 className="text-2xl font-bold mt-3 mb-5 text-white">{message}</h1>
    </div>
  );
}
