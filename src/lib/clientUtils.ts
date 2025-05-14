import { useState, useEffect } from 'react';

export interface User {
  id: string | number;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  user_id?: string | number;
}

export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
}

export function safeLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const value = localStorage.getItem(key);
    if (!value) return defaultValue;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error accessing localStorage for key "${key}":`, error);
    return defaultValue;
  }
}


export function setLocalStorage(key: string, value: any): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage for key "${key}":`, error);
    return false;
  }
}


export function getUserFromLocalStorage(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const sessionData = localStorage.getItem('userSession');
    if (!sessionData) return null;

    const userData = JSON.parse(sessionData);
    console.log('User data from localStorage:', sessionData);
    if (userData.user) {
      return userData.user as User;
    } else if (userData.first_name || userData.user_id) {
      return {
        id: userData.user_id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        email: userData.email
      };
    }
    return null;
  } catch {
    return null;
  }
}
