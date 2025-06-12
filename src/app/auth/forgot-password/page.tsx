'use client'
import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function ForgotPassword() {
    const router = useRouter();
    const formRef = useRef<HTMLDivElement | null>(null);
    const titleRef = useRef<HTMLHeadingElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    
    const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [attempts, setAttempts] = useState(3);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [timeLeft, setTimeLeft] = useState(300); 
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        const initTimer = setTimeout(() => {
            if (!cardRef.current || !titleRef.current || !formRef.current) return;
            
            const tl = gsap.timeline();
            
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
        }, 100); 
        
        return () => {
            clearTimeout(initTimer);
            gsap.killTweensOf([cardRef.current, titleRef.current]);
            if (formRef.current && formRef.current.children) {
                gsap.killTweensOf(Array.from(formRef.current.children));
            }
        };
    }, []);
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerActive, timeLeft]);

    const startTimer = () => {
        setTimeLeft(300); 
        setTimerActive(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSendOTP = async (e: React.FormEvent) => {
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
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                setOtpSent(true);
                setStep('otp');
                startTimer();
                
                if (formRef.current) {
                    const formHeight = formRef.current.clientHeight;
                    gsap.to(formRef.current, { 
                        height: formHeight,
                        opacity: 0,
                        duration: 0.4,
                        onComplete: () => {
                            gsap.to(formRef.current, {
                                opacity: 1,
                                duration: 0.5,
                                ease: "power2.out"
                            });
                        }
                    });
                }
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (attempts <= 0) {
            setError('Account locked. Please contact support to unlock your account');
            return;
        }
        
        if (!otp.trim()) {
            setError('Please enter the OTP sent to your email');
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();
                console.log('OTP verification response:', data);
            if (response.ok) {
                setTimerActive(false);
                
                if (formRef.current) {
                    const currentHeight = formRef.current.clientHeight;
                    
                    // First phase: fade out current form
                    gsap.to(formRef.current, { 
                        opacity: 0,
                        duration: 0.25,
                        onComplete: () => {
                            // Update state to show new form (but still invisible)
                            setStep('newPassword');
                            
                            // Use a short timeout to ensure DOM has updated
                            setTimeout(() => {
                                if (!formRef.current) return;
                                
                                // Second phase: adjust height and fade in smoothly
                                gsap.fromTo(formRef.current, 
                                    { 
                                        opacity: 0,
                                        height: 'auto',
                                        y: -10 
                                    },
                                    { 
                                        opacity: 1, 
                                        height: 'auto',
                                        y: 0,
                                        duration: 0.4,
                                        ease: "power2.out"
                                    }
                                );
                            }, 50);
                        }
                    });
                } else {
                    setStep('newPassword');
                }
            } else {
                setAttempts(prev => prev - 1);
                setError(`Invalid OTP. ${attempts - 1} attempts remaining`);
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/update-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    newPassword 
                }),
            });

            const data = await response.json();
            if (response.ok) {
                // Improved animation sequence to prevent container height issues
                if (formRef.current) {
                    // First fade out the form
                    gsap.to(formRef.current, { 
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            // After form is invisible, prepare the success message
                            gsap.set('.success-message', { 
                                display: 'block', 
                                height: 'auto',
                                opacity: 0,
                                y: 10
                            });
                            
                            // Hide the form completely
                            gsap.set(formRef.current, { display: 'none' });
                            
                            // Animate in the success message
                            gsap.to('.success-message', {
                                opacity: 1, 
                                y: 0, 
                                duration: 0.5,
                                ease: "power2.out",
                                clearProps: "height" // This ensures height isn't fixed after animation
                            });
                            
                            // Animate the success icon
                            gsap.fromTo('.success-icon', 
                                { scale: 0.5, opacity: 0 },
                                { scale: 1, opacity: 1, duration: 0.7, ease: "elastic.out(1, 0.5)" }
                            );
                        }
                    });
                }
                
                // Redirect after a delay
                setTimeout(() => {
                    router.push('/auth');
                }, 3000);
            } else {
                setError(data.message || 'Failed to update password');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderFormContent = () => {
        switch (step) {
            case 'otp':
                return (
                    <form onSubmit={handleVerifyOTP}>
                        <div className="space-y-4">
                            <div className="flex space-x-4 p-4 bg-blue-50 dark:bg-slate-700/30 rounded-lg border-l-4 border-blue-500 dark:border-blue-400">
                                <div className="shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Enter the verification code sent to <span className="font-medium">{email}</span>
                                    </p>
                                    <p className="text-xs mt-1 text-blue-600 dark:text-blue-300">
                                        Time remaining: <span className="font-mono">{formatTime(timeLeft)}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Verification Code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        id="otp"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-700' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400'} bg-white dark:bg-slate-700/50 focus:outline-none focus:ring-2 transition-all duration-200 dark:text-white`}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        inputMode="numeric"
                                        aria-describedby={error ? "otp-error" : undefined}
                                    />
                                </div>
                                {error && (
                                    <p 
                                        id="otp-error" 
                                        className="error-message mt-1.5 text-sm text-red-600 dark:text-red-400"
                                    >
                                        {error}
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex flex-col space-y-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || timeLeft === 0}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                    aria-busy={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Verifying...</span>
                                        </>
                                    ) : "Verify Code"}
                                </button>
                                
                                {timeLeft === 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('email');
                                            setError(null);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
                                    >
                                        Code expired? Request a new one
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                );
                
            case 'newPassword':
                return (
                    <form onSubmit={handleUpdatePassword}>
                        <div className="space-y-4">
                            <div className="flex space-x-4 p-4 bg-green-50 dark:bg-slate-700/30 rounded-lg border-l-4 border-green-500 dark:border-green-400 animate-fade-in">
                                <div className="shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 dark:text-green-400">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    Code verified! Create your new password below.
                                </p>
                            </div>
                            
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        id="new-password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 bg-white dark:bg-slate-700/50 focus:outline-none focus:ring-2 transition-all duration-200 dark:text-white"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        id="confirm-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-700' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400'} bg-white dark:bg-slate-700/50 focus:outline-none focus:ring-2 transition-all duration-200 dark:text-white`}
                                        placeholder="••••••••"
                                        aria-describedby={error ? "password-error" : undefined}
                                    />
                                </div>
                                {error && (
                                    <p 
                                        id="password-error" 
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
                                        <span>Updating...</span>
                                    </>
                                ) : "Update Password"}
                            </button>
                        </div>
                    </form>
                );
            
            default:
                return (
                    <form onSubmit={handleSendOTP}>
                        <div className="space-y-4">
                            <div className="flex space-x-4 p-4 bg-blue-50 dark:bg-slate-700/30 rounded-lg border-l-4 border-blue-500 dark:border-blue-400">
                                <div className="shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                </div>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    Enter your email address below and we'll send you a verification code to reset your password.
                                </p>
                            </div>
                            
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
                                ) : "Send Verification Code"}
                            </button>
                        </div>
                    </form>
                );
        }
    };
    
    const getTitleText = () => {
        switch (step) {
            case 'otp':
                return 'Verify Your Identity';
            case 'newPassword':
                return 'Create New Password';
            default:
                return 'Password Recovery';
        }
    };
    
    return (
        <div className="bg-auth min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
            {/* Remove toast notification markup */}
            
            <div ref={cardRef} className="w-full max-w-md relative z-10">
                <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-700 dark:via-blue-700 dark:to-purple-700 p-6 rounded-t-2xl relative overflow-hidden">
                        <div className="absolute inset-0" />
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h1 ref={titleRef} className="text-white text-xl font-bold tracking-wide">
                                {getTitleText()}
                            </h1>
                        </div>
                        
                        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -left-16 -top-16 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                    
                    <div ref={formRef} className="p-8 space-y-6">
                        {renderFormContent()}
                        
                        <div className="flex justify-center">
                            <Link href="/auth" className="group text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 group-hover:-translate-x-1 transition-transform">
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                                Return to Login
                            </Link>
                        </div>
                    </div>
                    
                    {/* Enhanced success message with controlled height */}
                    <div className="success-message p-8 space-y-6 opacity-0 translate-y-4 hidden">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="success-icon w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-200 dark:shadow-green-900/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Password Reset Complete!</h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Your password has been updated successfully.
                            </p>
                            <div className="w-full max-w-xs bg-gray-100 dark:bg-gray-800/50 rounded-full h-1.5 mt-2">
                                <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full animate-redirect-progress"></div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Redirecting to login page...
                            </p>
                        </div>
                        
                        <div className="flex justify-center">
                            <Link href="/auth" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white py-2.5 px-5 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                                Log In Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .bg-grid-white\/10 {
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }

                @keyframes redirect-progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                
                .animate-redirect-progress {
                    animation: redirect-progress 3s linear forwards;
                }
                
                @keyframes success-bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-20px); }
                    60% { transform: translateY(-10px); }
                }
                
                .animate-success-bounce {
                    animation: success-bounce 1s ease-out;
                }
            `}</style>
        </div>
    )
}
