'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  
  
  useEffect(() => {
    setIsClient(true);
    
   
    let startTime: number;
    const duration = 2000; 
    
    const animateProgress = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      const progressPercentage = Math.min(elapsedTime / duration * 100, 100);
      
      setProgress(progressPercentage);
      
      if (progressPercentage < 25) {
        setLoadingMessage("Loading resources...");
      } else if (progressPercentage < 50) {
        setLoadingMessage("Preparing chat system...");
      } else if (progressPercentage < 75) {
        setLoadingMessage("Connecting to services...");
      } else {
        setLoadingMessage("Almost ready...");
      }
      
      if (progressPercentage < 100) {
        requestAnimationFrame(animateProgress);
      } else {
      
        setTimeout(() => {
          router.push('/auth?mode=login');
        }, 3000);
      }
    };
  
    requestAnimationFrame(animateProgress);
 
    const redirectTimeout = setTimeout(() => {
      router.push('/auth?mode=login');
    }, 3000);
    
    return () => clearTimeout(redirectTimeout);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-auth pb-24">
      <div className="glass-card p-10 pb-14 rounded-xl flex flex-col items-center justify-center max-w-2xl w-full mx-auto relative mt-[-80px]">
        {/* Logo container with reduced bottom padding to minimize gap */}
        <div className="animate-bounce-subtle w-[95%] max-w-[600px] relative aspect-square pb-5">
          <Image 
            src="/images/lschat-logo.png" 
            alt="LS Chat Logo"
            fill
            sizes="(max-width: 768px) 95vw, (max-width: 1200px) 70vw, 50vw"
            priority
            className="drop-shadow-xl object-contain"
          />
        </div>
        
        {/* Enhanced Loading progress bar - positioned to overlap with logo bottom */}
        <div className="w-full absolute bottom-8 left-0 px-10">
          <div className="relative">
            <div className="h-5 w-full bg-black/20 dark:bg-white/10 backdrop-blur-sm rounded-full overflow-hidden shadow-inner border border-white/20">
              <div 
                className="h-full rounded-full relative overflow-hidden transition-all duration-300 flex items-center"
                style={{ 
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #7a2fb5, #9333ea, #7c3aed)",
                  boxShadow: "0 0 15px rgba(124, 58, 237, 0.5)"
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                {progress > 10 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white h-3 w-3 rounded-full shadow-lg shadow-purple-600/50"></div>
                )}
              </div>
            </div>
            <p className="absolute right-0 top-0 -mt-6 text-sm font-mono text-white/80">
              {Math.round(progress)}%
            </p>
          </div>
          
          <p className="text-center text-sm text-white/70 mt-4 animate-pulse">
            {loadingMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
