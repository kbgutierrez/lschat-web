'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { profileManagementAPI } from '@/lib/profileManagementApi';
import { useRouter } from 'next/navigation';

export default function ProfileManagement() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
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
        } else {
          // If no user session, redirect to login
          router.push('/auth');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push('/auth');
      }
    };

    loadUserData();
  }, [router]);

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

    // Basic validations
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

    // Password validation - only if password field is not empty
    if (profileData.password) {
      if (profileData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (profileData.password !== profileData.confirmPassword) {
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
      console.log('Current user data:', currentUser); // Log the current user data to see what's missing
      setProfileErrors({ form: 'User ID not found. Please login again.' });
      return;
    }

    setIsLoading(true);

    try {
      // Get current password from session if needed
      const userSessionStr = localStorage.getItem('userSession');
      let currentPassword = '';
      
      if (userSessionStr) {
        const userSession = JSON.parse(userSessionStr);
        currentPassword = userSession.user.password || '';
      }
      
      // Use current password from session if no new password is provided
      const dataToSubmit = {
        ...profileData,
        password: profileData.password || currentPassword
      };

      const response = await profileManagementAPI.updateProfile(
        currentUser.user_id,
        dataToSubmit
      );

      if (response.success) {
        // Show success message
        setShowSuccessMessage(true);
        
        // Update local storage with new user data to keep it in sync
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
              mobileNumber: profileData.mobileNumber, // Update the session with the new values
              // Don't update password in session if it wasn't changed
              password: profileData.password || userSession.user.password
            }
          };
          localStorage.setItem('userSession', JSON.stringify(updatedUserSession));
          
          // Also update our current state
          setCurrentUser(updatedUserSession.user);
        }
        
        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
        
        // Hide success message after a delay
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
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

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Profile Management</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Update your personal information</p>
        
        {profileErrors.form && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-600 dark:text-red-400 mb-6">
            {profileErrors.form}
          </div>
        )}
        
        {showSuccessMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm text-green-600 dark:text-green-400 mb-6">
            Profile updated successfully!
          </div>
        )}
        
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                id="middleName"
                name="middleName"
                label="Middle Name (Optional)"
                placeholder="Santos"
                value={profileData.middleName}
                onChange={handleProfileChange}
              />
            </div>
            
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
              id="username"
              name="username"
              label="Username"
                placeholder="juandelacruz"
                value={profileData.username}
                onChange={handleProfileChange}
                error={profileErrors.username}
                required
              />
            
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
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Leave blank if you don't want to change your password</p>
              
              <div className="space-y-4">
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
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={() => router.back()}
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
    </div>
  );
}

