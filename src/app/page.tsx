'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/auth?mode=login');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-auth">
      <div className="glass-card p-8 rounded-lg flex flex-col items-center justify-center">
        <Image
          src="/images/lschat-logo.png"
          alt="LS Chat Logo"
          width={80}
          height={80}
          className="mb-4"
          priority
        />
        <h1 className="text-2xl font-bold mb-4">LS Chat</h1>
        <p className="text-gray-500 mb-6">Redirecting to login...</p>
        
        <div className="space-y-2">
          <Link 
            href="/auth"
            className="block text-blue-600 hover:underline text-center"
          >
            Click here if you are not redirected automatically
          </Link>
        </div>
      </div>
    </div>
  );
}
