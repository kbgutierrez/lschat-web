'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { profileManagementAPI,updateProfilePictureApi } from '@/lib/profileManagementApi';

interface ProfileManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileManagementModal({ isOpen, onClose }: ProfileManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasScrollContent, setHasScrollContent] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = () => {
    try {
      const userSessionStr = localStorage.getItem('userSession');
      if (userSessionStr) {
        const userSession = JSON.parse(userSessionStr);
        
        console.log('User session data:', userSession);
        console.log('User object:', userSession.user);
        
        setCurrentUser(userSession.user);
        
        setProfileData({
          firstName: userSession.user.firstName || '',
          middleName: userSession.user.middleName || '',
          lastName: userSession.user.lastName || '',
          username: userSession.user.username || '',
          email: userSession.user.email || '',
          mobileNumber: userSession.user.mobileNumber || userSession.user.mobile_number || '',
          password: '',
          confirmPassword: '',
        });

        console.log('Available user fields:', Object.keys(userSession.user));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));

    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const errors: Record<string, string> = {};

    if (!profileData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!profileData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!profileData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!profileData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10,15}$/.test(profileData.mobileNumber.replace(/[-()\s]/g, ''))) {
      errors.mobileNumber = 'Mobile number is invalid';
    }

  
    if (profileData.password || profileData.confirmPassword) {

      if (!profileData.password) {
        errors.password = 'Password is required when confirmation is provided';
      } else if (profileData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (!profileData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (profileData.password !== profileData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfile()) return;
    if (!currentUser?.user_id) {
      console.log('Current user data:', currentUser);
      setProfileErrors({ form: 'User ID not found. Please login again.' });
      return;
    }

    
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmation(false);
    setIsLoading(true);

    try {
   
      const userSessionStr = localStorage.getItem('userSession');
      let currentPassword = '';
      
      if (userSessionStr) {
        const userSession = JSON.parse(userSessionStr);
        currentPassword = userSession.user.password || '';
      }
      
     
      const dataToSubmit = {
        ...profileData,
        password: profileData.password || currentPassword
      };

      const response = await profileManagementAPI.updateProfile(
        currentUser.user_id,
        dataToSubmit
      );

      if (response.success) {
  
        setShowSuccessMessage(true);
        
    
        const userSessionStr = localStorage.getItem('userSession');
        if (userSessionStr) {
          const userSession = JSON.parse(userSessionStr);
          const updatedUserSession = {
            ...userSession,
            user: {
              ...userSession.user,
              firstName: profileData.firstName,
              middleName: profileData.middleName,
              lastName: profileData.lastName,
              username: profileData.username,
              email: profileData.email,
              mobileNumber: profileData.mobileNumber,
              password: profileData.password || userSession.user.password
            }
          };
          localStorage.setItem('userSession', JSON.stringify(updatedUserSession));
          
          setCurrentUser(updatedUserSession.user);
        }

        setProfileData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
     
        setTimeout(() => {
          setShowSuccessMessage(false);
          onClose();
        }, 3000);
      } else {
        setProfileErrors({ 
          form: response.error || 'Failed to update profile. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      setProfileErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureChange = async (file: File) => {
    console.log('userid', currentUser?.user_id);
    console.log('file', file);
    if (!file) {
      console.error('No file selected for profile picture.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      console.error('File size exceeds 5MB limit.');
      return;
    }
    if (!currentUser?.user_id) {
      console.error('User ID not found. Please login again.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await updateProfilePictureApi.updateProfilePicture(currentUser.user_id, file);
      if (response.success) {
        console.log('Profile picture updated successfully:', response);
        
        const userSessionStr = localStorage.getItem('userSession');
        if (userSessionStr) {
          const userSession = JSON.parse(userSessionStr);
          const updatedUserSession = {
            ...userSession,
            user: {
              ...userSession.user,
              profilePicture: response.profilePicture || userSession.user.profilePicture
            }
          };
          localStorage.setItem('userSession', JSON.stringify(updatedUserSession));
          
          setCurrentUser(updatedUserSession.user);
        }
      } else {
        console.error('Failed to update profile picture:', response.message);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
    finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const hasOverflow = container.scrollHeight > container.clientHeight;
      setHasScrollContent(hasOverflow);
      setIsAtBottom(container.scrollTop + container.clientHeight >= container.scrollHeight - 20);
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => {
      window.removeEventListener('resize', checkScroll);
    };
  }, [isOpen]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setIsAtBottom(container.scrollTop + container.clientHeight >= container.scrollHeight - 20);
  };

  const handleScrollDown = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const targetScroll = Math.min(
      container.scrollTop + container.clientHeight * 0.8,
      container.scrollHeight - container.clientHeight
    );
    
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Management</h1>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="p-5 max-h-[calc(90vh-80px)] overflow-y-auto scroll-smooth"
          onScroll={handleScroll}
        >
          <div className="md:flex md:space-x-6">
            <div className="md:w-3/5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Update your personal information</p>
              
              {profileErrors.form && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-600 dark:text-red-400 mb-5">
                  {profileErrors.form}
                </div>
              )}
              
              {showSuccessMessage && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm text-green-600 dark:text-green-400 mb-5">
                  Profile updated successfully!
                </div>
              )}
              
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-5">
                    <Input
                      id="firstName"
                      name="firstName"
                      label="First Name"
                      placeholder="Juan"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      error={profileErrors.firstName}
                      required
                    />
                    
                    <Input
                      id="lastName"
                      name="lastName"
                      label="Last Name"
                      placeholder="Dela Cruz"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      error={profileErrors.lastName}
                      required
                    />
                    
                    <Input
                      id="middleName"
                      name="middleName"
                      label="Middle Name (Optional)"
                      placeholder="Santos"
                      value={profileData.middleName}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                  
                      <Input
                        id="username"
                        name="username"
                        label="Username"
                        placeholder="juandelacruz"
                        value={profileData.username}
                        onChange={handleProfileChange}
                        error={profileErrors.username}
                        required
                        readOnly={true}
                        className="bg-gray-500/50 dark:bg-gray-700/50 cursor-not-allowed"
                      />
                  
                    </div>
                    
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email"
                      placeholder="juan@example.com"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      error={profileErrors.email}
                      required
                    />
                    
                    <Input
                      id="mobileNumber"
                      name="mobileNumber"
                      label="Mobile Number"
                      placeholder="+63 912 345 6789"
                      value={profileData.mobileNumber}
                      onChange={handleProfileChange}
                      error={profileErrors.mobileNumber}
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Leave blank if you don't want to change your password</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      label="New Password"
                      placeholder="••••••••"
                      value={profileData.password}
                      onChange={handleProfileChange}
                      error={profileErrors.password}
                      showPasswordToggle={true}
                    />
                    
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      label="Confirm New Password"
                      placeholder="••••••••"
                      value={profileData.confirmPassword}
                      onChange={handleProfileChange}
                      error={profileErrors.confirmPassword}
                      showPasswordToggle={true}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center justify-center min-w-[100px]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="md:w-2/5 mt-6 md:mt-0">
              <div className="bg-gray-50  dark:bg-gray-700/30 rounded-lg p-5 border border-gray-100 dark:border-gray-600 h-full">
                <div className="flex items-center mb-6 cursor-pointer" >
                    <div className="relative w-16 h-16 mr-4">
                   
                    {currentUser?.profilePicture ? (
                      <img
                      src={currentUser.profilePicture}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xl font-bold">
                      {profileData.firstName && profileData.lastName 
                        ? `${profileData.firstName[0]}${profileData.lastName[0]}`
                        : profileData.username?.[0] || 'U'
                      }
                      </div>
                    )}
                    
                    <input 
                      type="file" 
                      id="profilePicture" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleProfilePictureChange(e.target.files[0])}
                    />
                    
                    <label 
                      htmlFor="profilePicture" 
                      className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center  hover:bg-opacity-20 transition-all duration-200"
                      title="Change profile picture"
                    >
                      {isLoading ? (
                      <div className="w-full h-full rounded-full flex items-center justify-center bg-black bg-opacity-40">
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                      </div>
                      ) : (
                      <span className="opacity-0 hover:opacity-100 text-white text-xs">
                        Change
                      </span>
                      )}
                    </label>
                    </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {profileData.firstName} {profileData.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profileData.username || 'Username'} • {profileData.email || 'Email'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Password Security</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      We recommend using a strong password that you don't use elsewhere. Passwords
                      should be at least 6 characters long.
                    </p>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Status</h4>
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modern animated scroll indicator arrow - only shown if needed */}
        {hasScrollContent && !isAtBottom && (
          <button 
            onClick={handleScrollDown}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-all duration-300 hover:shadow-xl animate-bounce-gentle z-10"
            aria-label="Scroll down"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
        
        {/* Save Confirmation Dialog */}
        {showSaveConfirmation && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl animate-fade-in-up"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Confirmation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-5">
                Are you sure you want to save these changes to your profile?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setShowSaveConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleConfirmSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
