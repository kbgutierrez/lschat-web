'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { getMessagingToken } from '@/lib/firebase';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const session = localStorage.getItem('userSession');
        if (session) {
          const data = JSON.parse(session);
          if (data.user && data.token) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fcm_token = await getMessagingToken();
      const response = await authAPI.login(username, password, fcm_token);
      
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('userSession', JSON.stringify(response));
        
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', 
            JSON.stringify({ username, password })
          );
        } else {
          localStorage.removeItem('rememberedCredentials');
        }
        
        return;
      } 
      
      setError(response.message || 'Login failed');
    } catch (error: any) {
      setError(error.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userSession');
    setUser(null);
    router.push('/auth');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      isAuthenticated: !!user,
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
