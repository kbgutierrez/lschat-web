'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Login } from '@/components/auth/login';
import { Signup } from '@/components/auth/signup';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (document.referrer && document.referrer.includes(window.location.origin)) {
      setShowInitialLoader(false);
      return;
    }

    setShowInitialLoader(true);
  }, []);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    }

    const signup = searchParams.get('signup');
    if (signup === 'success') {
      setIsLogin(true);
      setSignupSuccess(true);

      setTimeout(() => setSignupSuccess(false), 5000);
    }
  }, [searchParams]);

  const toggleAuthMode = () => {
    setAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setTimeout(() => {
        setAnimating(false);
      }, 50);
    }, 200);
  };

  return (
    <>
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

        <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-white/95 dark:bg-gray-800 animate-slide-in-right relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 hidden dark:block dark:bg-blue-900/20 rounded-full -translate-y-1/2 -translate-x-1/2 opacity-70"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 hidden dark:block dark:bg-purple-900/20 rounded-full translate-y-1/3 -translate-x-1/3 opacity-70"></div>
            <div className="absolute top-1/2 right-10 w-10 h-10 hidden dark:block dark:bg-yellow-600/20 rounded-full animate-pulse-subtle"></div>
            <div className="absolute top-20 left-10 w-6 h-6 hidden dark:block dark:bg-green-600/20 rounded-full animate-float"></div>
            <div className="absolute bottom-20 right-20 w-8 h-8 hidden dark:block dark:bg-red-600/20 rounded-full animate-float-reverse"></div>
            <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-white/70 to-white/90 dark:from-transparent dark:via-transparent dark:to-blue-900/10"></div>
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent top-10 left-0"></div>
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent bottom-10 left-0"></div>
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

            <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white animate-fade-in-up">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-400 mb-8 animate-fade-in-up delay-100">
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

            {signupSuccess && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm text-green-600 dark:text-green-400 mb-4 animate-fade-in">
                Account created successfully! Please log in with your new credentials.
              </div>
            )}

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
                <Login isLoading={isLoading} setIsLoading={setIsLoading} />
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
                <Signup 
                  isLoading={isLoading} 
                  setIsLoading={setIsLoading} 
                  showPrivacyModal={showPrivacyModal}
                  setShowPrivacyModal={setShowPrivacyModal}
                />
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
            className="bg-white dark:bg-gray-800 rounded-md shadow-xl max-w-xl w-full max-h-[90vh] overflow-auto animate-scale-in"
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
