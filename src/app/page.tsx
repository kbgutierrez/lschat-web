'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Only redirect after hydration
  useEffect(() => {
    setIsClient(true);
    const redirectTimeout = setTimeout(() => {
      router.push('/auth?mode=login');
    }, 100);
    return () => clearTimeout(redirectTimeout);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-auth">
      <div className="glass-card p-8 rounded-lg flex flex-col items-center justify-center">
        <div className="w-20 h-20 relative mb-4">
          <Image
            src="/images/lschat-logo.png"
            alt="LS Chat Logo"
            width={80}
            height={80}
            priority
          />
        </div>
        <h1 className="text-2xl font-bold mb-4">LS Chat</h1>
        <p className="text-gray-500 mb-6">
          Welcome to LS Chat
        </p>
        
        <div className="space-y-2">
          <Link 
            href="/auth"
            className="block text-blue-600 hover:underline text-center"
          >
            {isClient ? "Click here if not redirected" : "Preparing..."}
          </Link>
        </div>
      </div>
    </div>
  );
}
