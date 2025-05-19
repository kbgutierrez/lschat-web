'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { signUpAPI } from '@/lib/signUpApi';

interface SignupProps {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  showPrivacyModal: boolean;
  setShowPrivacyModal: (show: boolean) => void;
}

export function Signup({ isLoading, setIsLoading, showPrivacyModal, setShowPrivacyModal }: SignupProps) {
  const router = useRouter();
  
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

  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegister()) return;
    
    // Show confirmation dialog instead of immediately submitting
    setShowConfirmation(true);
  };
  
  const proceedWithSignup = async () => {
    setShowConfirmation(false);
    setIsLoading(true);

    try {
      const response = await signUpAPI.register({
        firstName: registerData.firstName,
        middleName: registerData.middleName,
        lastName: registerData.lastName,
        username: registerData.username,
        email: registerData.email,
        mobileNumber: registerData.mobileNumber,
        password: registerData.password,
      });

      if (response.success) {
        console.log('Registration successful:', response.message);
        
        // Show success message
        setSignupSuccess(true);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/auth?signup=success');
        }, 2000);
      } else {
        console.error('Registration failed:', response.error);
        
        // Check for username duplicate error
        if (response.error && (
          response.error.includes('UNIQUE KEY constraint') || 
          response.error.includes('duplicate key') || 
          response.error.includes('already exist')
        )) {
          // Extract username from error message if possible
          const matches = response.error.match(/\(([^)]+)\)/);
          const username = matches && matches[1] ? matches[1] : registerData.username;
          
          // Set specific error for username field
          setRegisterErrors({ 
            username: `The username "${username}" is already taken. Please choose another.`
          });
        } else {
          // General error
          setRegisterErrors({ 
            form: response.error || 'Registration failed. Please try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setRegisterErrors({ form: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {registerErrors.form && (
 
        <div className="flex items-center gap-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
           {registerErrors.form}
          </p>
        </div>
      )}
      
      {signupSuccess && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm text-green-600 dark:text-green-400 mb-4">
          Registration successful! Redirecting you to login...
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
              id="middle-name"
              name="middleName"
              label="Middle Name (Optional)"
              placeholder="Santos"
              value={registerData.middleName}
              onChange={handleRegisterChange}
            />
          </div>
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
            showPasswordToggle={true}
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
            showPasswordToggle={true}
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
            disabled={isLoading || signupSuccess}
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Creating account...
              </>
            ) : signupSuccess ? 'Account created!' : 'Create account'}
          </button>
        </div>
      </form>
      
      {/* Improved Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/50 to-black/70"
            onClick={() => setShowConfirmation(false)}
          ></div>
          
          <div
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in border border-gray-100 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            <div className="p-6">
              <div className="mb-6 flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Registration
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please review your information before creating your account:
              </p>
              
              <div className="space-y-3 text-sm mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="col-span-1 text-gray-500 dark:text-gray-400">Full Name:</div>
                    <div className="col-span-2 font-medium text-gray-900 dark:text-gray-100">
                      {registerData.firstName} {registerData.middleName} {registerData.lastName}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="col-span-1 text-gray-500 dark:text-gray-400">Username:</div>
                    <div className="col-span-2 font-medium text-gray-900 dark:text-gray-100">{registerData.username}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="col-span-1 text-gray-500 dark:text-gray-400">Email:</div>
                    <div className="col-span-2 font-medium text-gray-900 dark:text-gray-100">{registerData.email}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 text-gray-500 dark:text-gray-400">Mobile:</div>
                    <div className="col-span-2 font-medium text-gray-900 dark:text-gray-100">{registerData.mobileNumber}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center"
                  onClick={() => setShowConfirmation(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 hover:shadow-md active:scale-95 flex items-center"
                  onClick={proceedWithSignup}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
