'use client';

import { useState, useEffect } from 'react';

export function Footer() {
  // Use state to prevent hydration mismatch with the year
  const [year, setYear] = useState('');
  
  // Only set the year on the client side after hydration
  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="w-full py-4 px-4 mt-8 bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-gray-900/80 dark:via-gray-800/60 dark:to-gray-900/80 border-t border-gray-200 dark:border-gray-700 shadow-inner backdrop-blur-md flex flex-col items-center justify-center">
      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
        &copy; {year || '2023'} LS Chat. All rights reserved.
      </div>
      <div className="mt-1 text-xs text-gray-400 dark:text-gray-600">
        Made with <span className="text-pink-500">love</span> by your team
      </div>
    </footer>
  );
}
