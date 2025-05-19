'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

interface LoginProps {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export function Login({ isLoading, setIsLoading }: LoginProps) {
  const router = useRouter();
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSavedCredentials = () => {
      try {
        const savedCredentials = localStorage.getItem('rememberedCredentials');
        if (savedCredentials) {
          const { username, password } = JSON.parse(savedCredentials);
          setLoginData(prev => ({
            ...prev,
            username,
            password,
            rememberMe: true
          }));
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (loginErrors[name]) {
      setLoginErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateLogin = () => {
    const errors: Record<string, string> = {};

    if (!loginData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!loginData.password) {
      errors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLogin()) return;

    setIsLoading(true);

    try {
      const fcm_token = '';

      const response = await authAPI.login(
        loginData.username,
        loginData.password,
        fcm_token
      );

      if (response.success) {
        console.log('Login successful:', response);

        localStorage.setItem('userSession', JSON.stringify({
          token: response.token || 'dummy-token',
          user: {
            user_id: response.user?.user_id || response.user_id,
            firstName: response.user?.first_name || response.firstName,
            middleName: response.user?.middle_name || response.middleName,
            mobileNumber: response.user?.mobile_number || response.mobileNumber,
            lastName: response.user?.last_name || response.lastName,
            username: response.user?.username || response.username,
            password: loginData.password,
            email: response.user?.email || response.email,
          }
        }));

        if (loginData.rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            username: loginData.username,
            password: loginData.password
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }

        router.push('/dashboard');
      } else {
        setLoginErrors({ form: response.message || 'Invalid username or password' });
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoginErrors({
        form: error.message || 'Network error. Please try again later.'
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      {loginErrors.form && (
        <div className="flex items-center gap-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {loginErrors.form}
          </p>
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            id="login-username"
            name="username"
            label="Username"
            placeholder="juandelacruz"
            value={loginData.username}
            onChange={handleLoginChange}
            error={loginErrors.username}
            required
          />

          <Input
            id="login-password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={loginData.password}
            onChange={handleLoginChange}
            error={loginErrors.password}
            showPasswordToggle={true}
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            id="remember-me"
            name="rememberMe"
            label="Remember me"
            checked={loginData.rememberMe}
            onChange={handleLoginChange}
          />

          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 transition-all duration-300 flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
        </div>
      </form>
    </>
  );
}
