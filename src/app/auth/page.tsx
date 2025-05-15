'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/LoadingScreen';
import { authAPI } from '@/lib/api';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(100);
  const [animating, setAnimating] = useState(false);


  useEffect(() => {

    if (document.referrer && document.referrer.includes(window.location.origin)) {
      setShowInitialLoader(false);
      return;
    }
    
    setShowInitialLoader(true);
  }, []);

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
   
 
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    }
  }, [searchParams]);

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const [registerData, setRegisterData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    agreeToPrivacy: false
  });

  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

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

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (registerErrors[name]) {
      setRegisterErrors(prev => ({ ...prev, [name]: '' }));
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

  const validateRegister = () => {
    const errors: Record<string, string> = {};

    if (!registerData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!registerData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!registerData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!registerData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!registerData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10,15}$/.test(registerData.mobileNumber.replace(/[-()\s]/g, ''))) {
      errors.mobileNumber = 'Mobile number is invalid';
    }

    if (!registerData.password) {
      errors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!registerData.agreeToPrivacy) {
      errors.agreeToPrivacy = 'You must agree to the Data Privacy Statement';
    }

    setRegisterErrors(errors);
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
            lastName: response.user?.last_name || response.lastName,
            username: response.user?.username || response.username,
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegister()) return;

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Registration submitted:', registerData);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      setRegisterErrors({ form: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setTimeout(() => {
        setAnimating(false);
      }, 50);
    }, 200);
  };

  const directToSignup = () => {
    router.push('/auth?mode=signup');
  };

  return (
    <>
      {/* Only show LoadingScreen on initial page load, not for auth operations */}
      {showInitialLoader && (
        <LoadingScreen 
          isLoading={true}
          progress={100} 
          message="Loading LS Chat"
          autoHide={true}
        />
      )}

      <div className={cn(
        "min-h-screen flex items-stretch bg-auth relative overflow-hidden"
      )}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[10%] w-16 h-16 bg-blue-500/10 rounded-full blur-xl animate-float-slow"></div>
          <div className="absolute bottom-[20%] right-[15%] w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-[40%] right-[20%] w-24 h-24 bg-teal-500/10 rounded-full blur-xl animate-float-reverse"></div>
        </div>

        <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-transparent -mt-[200px] animate-fade-in">
          <div className="transform hover:scale-105 transition-transform duration-500">
            <Image 
              src="/images/lschat-logo.png" 
              alt="LS Chat Logo"
              width={880}
              height={880}
              className="mb-8 animate-pulse-subtle"
              priority
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-white dark:bg-gray-800 animate-slide-in-right relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full -translate-y-1/2 -translate-x-1/2 opacity-70"></div>
            <div className="absolute light:hidden bottom-0 left-0 w-80 h-80 bg-purple-50 dark:bg-purple-900/20 rounded-full translate-y-1/3 -translate-x-1/3 opacity-70"></div>
            <div className="absolute top-1/2 right-10 w-10 h-10 bg-yellow-100 dark:bg-yellow-600/20 rounded-full animate-pulse-subtle"></div>
            <div className="absolute top-20 left-10 w-6 h-6 bg-green-100 dark:bg-green-600/20 rounded-full animate-float"></div>
            <div className="absolute bottom-20 right-20 w-8 h-8 bg-red-50 dark:bg-red-600/20 rounded-full animate-float-reverse"></div>
            <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 dark:to-blue-900/10"></div>
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent top-10 left-0"></div>
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent bottom-10 left-0"></div>
          </div>
          
          <div className="w-full max-w-lg relative z-10">
            <div className="flex justify-center md:hidden mb-8 animate-bounce-subtle">
              <Image 
                src="/images/lschat-logo.png" 
                alt="LS Chat Logo"
                width={320}
                height={320}
                className="drop-shadow-md"
                priority
              />
            </div>

            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white animate-fade-in-up">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 animate-fade-in-up delay-100">
              {isLogin ? 'Welcome to LS Chat' : 'Join LS Chat today'}
            </p>
            
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-8 shadow-sm animate-fade-in-up delay-200">
              <button
                type="button"
                className={cn(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-300",
                  isLogin 
                    ? "bg-blue-600 text-white shadow-md transform-gpu -translate-y-0.5" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
                onClick={() => !isLogin && toggleAuthMode()}
                disabled={animating}
              >
                Login
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-300",
                  !isLogin 
                    ? "bg-blue-600 text-white shadow-md transform-gpu -translate-y-0.5" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
                onClick={() => isLogin && toggleAuthMode()}
                disabled={animating}
              >
                Sign Up
              </button>
            </div>
            
            <div className="relative w-full overflow-visible animate-fade-in-up delay-300">
              <div 
                className="transition-all duration-500 ease-in-out transform"
                style={{ 
                  transform: isLogin 
                    ? 'translateX(0) rotateY(0)' 
                    : 'translateX(-105%) rotateY(-5deg)',
                  position: isLogin ? 'relative' : 'absolute',
                  width: '100%',
                  opacity: isLogin ? 1 : 0,
                  transformOrigin: 'left center',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  overflow: 'visible',
                  padding: '1px'
                }}
              >
                {loginErrors.form && (
                  <div className=" border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-600 dark:text-red-400 mb-4">
                    {loginErrors.form}
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
              </div>

              <div 
                className="transition-all duration-500 ease-in-out transform"
                style={{ 
                  transform: isLogin 
                    ? 'translateX(105%) rotateY(5deg)' 
                    : 'translateX(0) rotateY(0)',
                  position: isLogin ? 'absolute' : 'relative',
                  width: '100%',
                  opacity: isLogin ? 0 : 1,
                  transformOrigin: 'right center',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDelay: animating ? '0ms' : '50ms',
                  overflow: 'visible',
                  padding: '1px'
                }}
              >
                {registerErrors.form && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-600 dark:text-red-400 mb-4">
                    {registerErrors.form}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id="first-name"
                        name="firstName"
                        label="First Name"
                        placeholder="Juan"
                        value={registerData.firstName}
                        onChange={handleRegisterChange}
                        error={registerErrors.firstName}
                        required
                      />

                      <Input
                        id="last-name"
                        name="lastName"
                        label="Last Name"
                        placeholder="Dela Cruz"
                        value={registerData.lastName}
                        onChange={handleRegisterChange}
                        error={registerErrors.lastName}
                        required
                      />
                    </div>

                    <Input
                      id="middle-name"
                      name="middleName"
                      label="Middle Name (Optional)"
                      placeholder="Santos"
                      value={registerData.middleName}
                      onChange={handleRegisterChange}
                    />

                    <Input
                      id="register-username"
                      name="username"
                      label="Username"
                      placeholder="juandelacruz"
                      value={registerData.username}
                      onChange={handleRegisterChange}
                      error={registerErrors.username}
                      required
                    />

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email"
                      placeholder="juan@example.com"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      error={registerErrors.email}
                      required
                    />

                    <Input
                      id="mobile-number"
                      name="mobileNumber"
                      label="Mobile Number"
                      placeholder="+63 912 345 6789"
                      value={registerData.mobileNumber}
                      onChange={handleRegisterChange}
                      error={registerErrors.mobileNumber}
                      required
                    />

                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      error={registerErrors.password}
                      required
                    />

                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      label="Confirm Password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      error={registerErrors.confirmPassword}
                      required
                    />

                    <div className="mt-4">
                      <div className="flex items-start hover:bg-gray-50 dark:hover:bg-gray-700/20 p-2 rounded-md transition-colors duration-200">
                        <div className="flex items-center h-5">
                          <input
                            id="privacy"
                            name="agreeToPrivacy"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors duration-200"
                            checked={registerData.agreeToPrivacy}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="privacy" className="text-gray-600 dark:text-gray-400">
                            By signing up for an account, you acknowledge and accept our
                            <button 
                              type="button"
                              onClick={() => setShowPrivacyModal(true)}
                              className="text-blue-600 underline font-medium ml-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              Data Privacy Statement.
                            </button>
                          </label>
                          {registerErrors.agreeToPrivacy && (
                            <p className="mt-1 text-xs text-red-500 animate-pulse">{registerErrors.agreeToPrivacy}</p>
                          )}
                        </div>
                      </div>
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
                          Creating account...
                        </>
                      ) : 'Create account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center space-x-2">
              <div 
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300", 
                  isLogin 
                    ? "bg-blue-600 scale-110" 
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              ></div>
              <div 
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300", 
                  !isLogin 
                    ? "bg-blue-600 scale-110" 
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              ></div>
            </div>
          </div>
        </div>
      </div> 

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Data Privacy Statement</h3>
              <div className="text-gray-600 dark:text-gray-300 text-sm space-y-4">
                <p className="text-sm leading-6">
                  In compliance with the requirements of Data Privacy Act of 2012, we would like to ask your consent to collect, store, retain, disclose, dispose and process your personal information. Your information will be used to receive authentication to access LSBIZ and others that require authentication. Furthermore, it will be utilized for future messaging applications developed by the ICT Department.
                </p>
                
                <p className="text-sm leading-6">
                  Please be aware that your data will be kept secure and will not be shared with third parties. In case the personnformation collected is no longer needed, an official procedure will be followed to dispose of the given data.
                </p>
                                <p className="text-sm leading-6">
                  You have the right to request access, correct, update, or withdw your consent for the use of your personal data.t contact our Data Protection Officer via email <a href="mailto:dpo@lemonsquare.comh" className="text-blue-600 hover:underline">dpo@tsquare.com.ph</a> or call (02) 8-983-9417 to 19 local 121
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 hover:shadow-md active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
