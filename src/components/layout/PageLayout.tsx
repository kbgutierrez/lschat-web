import React from 'react';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
