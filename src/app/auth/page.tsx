'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Login } from '@/components/auth/login';
import { Signup } from '@/components/auth/signup';
import gsap from 'gsap';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // GSAP animation refs
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const decorativeElements = useRef<HTMLElement[]>([]);

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

  // GSAP animations
  useEffect(() => {
    if (!rightPanelRef.current) return;

    const tl = gsap.timeline();
    
    // Clear any existing animations
    gsap.set([
      rightPanelRef.current, 
      headingRef.current, 
      subheadingRef.current, 
      tabsRef.current, 
      formContainerRef.current,
      ...decorativeElements.current
    ], { clearProps: 'all' });

    // Initial animation
    tl.fromTo(rightPanelRef.current, 
      { opacity: 0, x: 50 }, 
      { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
    );

    // Animate heading and subheading
    tl.fromTo(headingRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" },
      "-=0.4"
    );
    
    tl.fromTo(subheadingRef.current,
      { opacity: 0, y: -15 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" },
      "-=0.3"
    );

    // Animate tabs
    tl.fromTo(tabsRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "-=0.2"
    );

    // Animate form container
    tl.fromTo(formContainerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "-=0.3"
    );

    // Animate decorative elements with stagger
    tl.fromTo(decorativeElements.current,
      { opacity: 0, scale: 0.8 },
      { 
        opacity: 0.7, 
        scale: 1, 
        duration: 0.8, 
        stagger: 0.1,
        ease: "elastic.out(1, 0.3)" 
      },
      "-=0.5"
    );

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    if (animating) {
      const formElements = formContainerRef.current?.querySelectorAll('input, button');
      if (formElements) {
        gsap.fromTo(formElements, 
          { opacity: 0, y: 10 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.4, 
            stagger: 0.05,
            ease: "power2.out",
            delay: 0.2
          }
        );
      }
    }
  }, [animating, isLogin]);

  const toggleAuthMode = () => {
    setAnimating(true);
    
    if (formContainerRef.current) {
      gsap.to(formContainerRef.current, {
        opacity: 0,
        y: isLogin ? -10 : 10, 
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          setIsLogin(!isLogin);
          setTimeout(() => {
            gsap.to(formContainerRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: "power2.out",
              onComplete: () => {
                setAnimating(false);
              }
            });
          }, 50);
        }
      });
    } else {
      // Fallback if ref isn't available
      setTimeout(() => {
        setIsLogin(!isLogin);
        setTimeout(() => {
          setAnimating(false);
        }, 50);
      }, 200);
    }
  };

  
  const addToDecorativeRefs = (el: HTMLElement | null): void => {
    if (el && !decorativeElements.current.includes(el)) {
      decorativeElements.current.push(el);
    }
  };

  return (
    <>
      <div className={cn(
        "min-h-screen flex items-stretch bg-auth relative overflow-hidden"
      )}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[10%] w-16 h-16 bg-white/10 rounded-full blur-xl animate-float-slow"></div>
          <div className="absolute bottom-[20%] right-[15%] w-32 h-32 bg-pink-300/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-[40%] right-[20%] w-24 h-24 bg-purple-300/10 rounded-full blur-xl animate-float-reverse"></div>
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

        <div 
          ref={rightPanelRef}
          className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div 
              ref={addToDecorativeRefs}
              className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/30 dark:bg-purple-900/30 rounded-full -translate-y-1/2 -translate-x-1/2"
            ></div>
            <div 
              ref={addToDecorativeRefs}
              className="absolute bottom-0 left-0 w-80 h-80 bg-violet-400/30 dark:bg-purple-800/20 rounded-full translate-y-1/3 -translate-x-1/3"
            ></div>
            <div 
              ref={addToDecorativeRefs}
              className="absolute top-1/2 right-10 w-10 h-10 bg-blue-400/30 dark:bg-yellow-600/20 rounded-full animate-pulse-subtle"
            ></div>
            <div 
              ref={addToDecorativeRefs}
              className="absolute top-20 left-10 w-6 h-6 bg-purple-300/30 dark:bg-green-600/20 rounded-full animate-float"
            ></div>
            <div 
              ref={addToDecorativeRefs}
              className="absolute bottom-20 right-20 w-8 h-8 bg-fuchsia-400/30 dark:bg-red-600/20 rounded-full animate-float-reverse"
            ></div>

            {/* Mirror finish background */}
            <div 
              ref={addToDecorativeRefs}
              className="absolute inset-0 bg-gradient-to-br from-blue-500/25 via-purple-500/20 to-indigo-500/25 dark:from-gray-900/90 dark:to-gray-800/80 backdrop-blur-md"
            ></div>
            
            {/* Reflective borders */}
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-blue-300 dark:via-gray-700 to-transparent top-10 left-0 opacity-70"></div>
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-purple-300 dark:via-gray-700 to-transparent bottom-10 left-0 opacity-70"></div>
            
            {/* Diagonal reflective highlight */}
            <div className="absolute w-[150%] h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent top-0 left-0 rotate-45 translate-y-[30vh]"></div>
          </div>

          <div className="w-full max-w-lg relative z-10 backdrop-blur-lg bg-white/30 bg-gradient-to-br from-blue-100/50 to-purple-100/50 dark:from-gray-800/70 dark:to-gray-900/70 p-8 rounded-xl shadow-[0_8px_32px_rgba(79,70,229,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-center md:hidden mb-8">
              <Image
                src="/images/lschat-logo.png"
                alt="LS Chat Logo"
                width={320}
                height={320}
                className="drop-shadow-md"
                priority
              />
            </div>

            <h2 
              ref={headingRef}
              className="text-2xl font-normal mb-3 text-indigo-800 dark:text-indigo-300 tracking-normal"
            >
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </h2>
            
            <p 
              ref={subheadingRef}
              className="text-sm text-indigo-900/70 dark:text-gray-400 mb-8"
            >
              {isLogin ? 'Welcome to LS Chat' : 'Join LS Chat today'}
            </p>

            <div 
              ref={tabsRef}
              className="flex border border-indigo-200/70 dark:border-gray-700 rounded-lg p-1 mb-8 shadow-sm bg-white/50 dark:bg-gray-900/50"
            >
              <button
                type="button"
                className={cn(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-300",
                  isLogin
                    ? "bg-gradient-to-r from-indigo-600 to-purple-500 text-white shadow-md transform-gpu -translate-y-0.5"
                    : "text-indigo-700 hover:text-indigo-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-700/50"
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
                    ? "bg-gradient-to-r from-indigo-600 to-purple-500 text-white shadow-md transform-gpu -translate-y-0.5"
                    : "text-indigo-700 hover:text-indigo-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-700/50"
                )}
                onClick={() => isLogin && toggleAuthMode()}
                disabled={animating}
              >
                Sign Up
              </button>
            </div>

            {signupSuccess && (
              <div className="bg-green-100/70 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm text-green-700 dark:text-green-400 mb-4">
                Account created successfully! Please log in with your new credentials.
              </div>
            )}

            <div 
              ref={formContainerRef} 
              className="relative w-full overflow-hidden" 
              style={{ 
                minHeight: "380px",
                clipPath: "inset(0)" // Ensures animations stay strictly within the container
              }}
            >
              {/* Login form */}
              <div
                className="w-full transition-all duration-500 ease-in-out transform"
                style={{
                  transform: isLogin ? 'translateX(0)' : 'translateX(-100%)',
                  position: isLogin ? 'relative' : 'absolute',
                  opacity: isLogin ? 1 : 0,
                  left: 0,
                  right: 0,
                  top: 0, // Ensure positioned at top of container
                  pointerEvents: isLogin ? 'auto' : 'none'
                }}
              >
                <Login isLoading={isLoading} setIsLoading={setIsLoading} />
              </div>

              {/* Signup form - with improved scrolling */}
              <div
                className="w-full transition-all duration-500 ease-in-out transform"
                style={{
                  transform: isLogin ? 'translateX(100%)' : 'translateX(0)',
                  position: isLogin ? 'absolute' : 'relative',
                  opacity: isLogin ? 0 : 1, 
                  left: 0,
                  right: 0,
                  top: 0, // Ensure positioned at top of container
                  pointerEvents: isLogin ? 'none' : 'auto',
                  maxHeight: isLogin ? 'unset' : '380px',
                  overflowY: isLogin ? 'hidden' : 'auto',
                  overflowX: 'hidden',
                  paddingRight: isLogin ? '0' : '6px'
                }}
              >
                <style jsx global>{`
                  /* Webkit scrollbar styles */
                  .scrollable-form::-webkit-scrollbar {
                    width: 5px;
                  }
                  .scrollable-form::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .scrollable-form::-webkit-scrollbar-thumb {
                    background-color: rgba(107, 114, 128, 0.3);
                    border-radius: 20px;
                  }
                `}</style>
                <div className={`pb-6 ${!isLogin ? 'scrollable-form' : ''}`}>
                  <Signup 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                    showPrivacyModal={showPrivacyModal}
                    setShowPrivacyModal={setShowPrivacyModal}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center space-x-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  isLogin
                    ? "bg-gradient-to-r from-indigo-600 to-purple-500 scale-110"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              ></div>
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  !isLogin
                    ? "bg-gradient-to-r from-indigo-600 to-purple-500 scale-110"
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
