'use client'
import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'

export default function ForgotPassword() {
    const formRef = useRef<HTMLDivElement | null>(null);
    const titleRef = useRef<HTMLHeadingElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Short delay to ensure DOM elements are properly rendered
        const initTimer = setTimeout(() => {
            if (!cardRef.current || !titleRef.current || !formRef.current) return;
            
            const tl = gsap.timeline();
            
            // Animate main content
            tl.from(cardRef.current, { 
                y: 30, 
                opacity: 0, 
                duration: 0.8, 
                ease: "back.out(1.5)" 
            });
            
            tl.from(titleRef.current, { 
                y: -15, 
                opacity: 0, 
                duration: 0.6,
                ease: "power2.out"
            }, "-=0.2");
            
            if (formRef.current && formRef.current.children) {
                tl.from(Array.from(formRef.current.children), { 
                    y: 25, 
                    opacity: 0, 
                    duration: 0.4, 
                    stagger: 0.1,
                    ease: "power1.out"
                });
            }
            
            setIsInitialized(true);
        }, 100); // Small delay to ensure DOM is ready
        
        // Cleanup function
        return () => {
            clearTimeout(initTimer);
            gsap.killTweensOf([cardRef.current, titleRef.current]);
            if (formRef.current && formRef.current.children) {
                gsap.killTweensOf(Array.from(formRef.current.children));
            }
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Please enter your email address');
            gsap.fromTo('.error-message', 
                { opacity: 0, y: -10 }, 
                { opacity: 1, y: 0, duration: 0.3 }
            );
            return;
        }
        setError(null);
        setIsSubmitting(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            
            // Animate success state
            if (formRef.current) {
                const formHeight = formRef.current.clientHeight;
                gsap.to(formRef.current, { 
                    height: formHeight,
                    opacity: 0,
                    duration: 0.4,
                    onComplete: () => {
                        gsap.to('.success-message', {
                            opacity: 1, 
                            y: 0, 
                            duration: 0.5,
                            ease: "power2.out"
                        });
                    }
                });
            }
        }, 1500);
    };
    
    return (
        <div className="bg-auth min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
            <div ref={cardRef} className="w-full max-w-md relative z-10">
                <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-700 dark:via-blue-700 dark:to-purple-700 p-6 rounded-t-2xl relative overflow-hidden">
                        <div className="absolute inset-0 " />
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h1 ref={titleRef} className="text-white text-xl font-bold tracking-wide">
                                Password Recovery
                            </h1>
                        </div>
                        
                        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -left-16 -top-16 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                    
                    {!submitted ? (
                        <div ref={formRef} className="p-8 space-y-6">
                            <div className="flex space-x-4 p-4 bg-blue-50 dark:bg-slate-700/30 rounded-lg border-l-4 border-blue-500 dark:border-blue-400">
                                <div className="shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                </div>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    Enter your email address below and we'll send you instructions to reset your password.
                                </p>
                            </div>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                                </svg>
                                            </div>
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-700' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400'} bg-white dark:bg-slate-700/50 focus:outline-none focus:ring-2 transition-all duration-200 dark:text-white`}
                                                placeholder="juandelacruz@email.com"
                                                aria-describedby={error ? "email-error" : undefined}
                                            />
                                        </div>
                                        {error && (
                                            <p 
                                                id="email-error" 
                                                className="error-message mt-1.5 text-sm text-red-600 dark:text-red-400"
                                            >
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                        aria-busy={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Sending...</span>
                                            </>
                                        ) : "Send Reset Link"}
                                    </button>
                                </div>
                            </form>
                            
                            <div className="flex justify-center">
                                <Link href="/auth" className="group text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 group-hover:-translate-x-1 transition-transform">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                    Return to Login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="success-message p-8 space-y-6 opacity-0 translate-y-4">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Check Your Email</h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    We've sent password recovery instructions to <span className="font-medium text-indigo-600 dark:text-indigo-400">{email}</span>
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
                                    (Please check your spam folder if you don't see it in your inbox)
                                </p>
                            </div>
                            
                            <div className="flex justify-center">
                                <Link href="/auth" className="group text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 group-hover:-translate-x-1 transition-transform">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                    Return to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx>{`
                .bg-grid-white\/10 {
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
                }
            `}</style>
        </div>
    )
}
