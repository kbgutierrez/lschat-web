'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { announcementsAPI, AnnouncementParticipant } from '@/lib/announcementsApi';
import { getUserFromLocalStorage } from '@/lib/clientUtils';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'content' | 'participants';

// Helper function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return '';
  
  const nameParts = name.trim().split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 0) return '';
  
  if (nameParts.length === 1) {
    // If only one name part, take up to first two characters
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  // Get first letter of first part and first letter of last part
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

export default function CreateAnnouncementModal({ isOpen, onClose }: CreateAnnouncementModalProps) {
  // Modal state
  const [step, setStep] = useState<Step>('content');
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Content state
  const [title, setTitle] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  
  // Participants state
  const [permissionType, setPermissionType] = useState<'everyone' | 'byGroup' | 'byUser'>('everyone');
  const [participants, setParticipants] = useState<AnnouncementParticipant[]>(
    [{ id: 'everyone', name: 'All Users', type: 'user' }]
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(['everyone']);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date for preview
  const announcementDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Fetch announcement permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchPermissions = async () => {
        try {
          setLoadingParticipants(true);
          const user = getUserFromLocalStorage();
          if (!user || !user.user_id) {
            throw new Error('User not found');
          }
          
          const permissions = await announcementsAPI.fetchAnnouncementPermissions(user.user_id);
          setPermissionType(permissions.permissionType);
          
          // Prepare participants list based on permission type
          let newParticipants: AnnouncementParticipant[] = [];
          let initialSelection: string[] = [];
          
          if (permissions.permissionType === 'everyone') {
            newParticipants = [{ id: 'everyone', name: 'All Users', type: 'user' }];
            initialSelection = ['everyone'];
          } 
          else if (permissions.permissionType === 'byGroup') {
            newParticipants = permissions.groups.map(group => ({
              id: `group_${group.group_id}`,
              name: group.name,
              type: 'group',
            }));
            // Pre-select the first group if any
            if (newParticipants.length > 0) {
              initialSelection = [newParticipants[0].id];
            }
          } 
          else if (permissions.permissionType === 'byUser') {
            newParticipants = permissions.users.map(user => ({
              id: `user_${user.user_id}`,
              name: user.name,
              type: 'user',
              image: user.profile_picture || undefined,
            }));
            // Pre-select the first user if any
            if (newParticipants.length > 0) {
              initialSelection = [newParticipants[0].id];
            }
          }
          
          setParticipants(newParticipants);
          setSelectedParticipants(initialSelection);
        } catch (err) {
          console.error('Error fetching announcement permissions:', err);
          setError('Failed to load announcement recipients. Please try again.');
          // Fallback to All Users in case of error
          setParticipants([{ id: 'everyone', name: 'All Users', type: 'user' }]);
          setSelectedParticipants(['everyone']);
        } finally {
          setLoadingParticipants(false);
        }
      };
      
      fetchPermissions();
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('content');
      setActiveTab('text');
      setTitle('');
      setAnnouncementText('');
      setSelectedImage(null);
      setPreviewUrl(null);
      setImageCaption('');
      setError(null);
    }
  }, [isOpen]);

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Clean up preview URL when component unmounts or when a new file is selected
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleTabChange = (tab: 'text' | 'image') => {
    setActiveTab(tab);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnnouncementText(e.target.value);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImageCaption(e.target.value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      setSelectedImage(file);
      setError(null);
      
      // Create a preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
    }
  };

  const handleNextStep = () => {
    // Validate content step
    if (title.trim() === '') {
      setError('Please enter a title for your announcement');
      return;
    }
    
    if (activeTab === 'text' && announcementText.trim() === '') {
      setError('Please enter announcement text');
      return;
    }
    
    if (activeTab === 'image' && !selectedImage) {
      setError('Please select an image');
      return;
    }
    
    setError(null);
    setStep('participants');
  };

  const handlePreviousStep = () => {
    setStep('content');
  };

  const handleParticipantToggle = (id: string) => {
    if (permissionType === 'everyone') {
      // When permission type is everyone, only "All Users" can be selected
      return;
    }
    
    setSelectedParticipants(prevSelected => {
      // If already selected, deselect it
      if (prevSelected.includes(id)) {
        // Don't allow deselecting all participants
        if (prevSelected.length === 1) {
          return prevSelected;
        }
        return prevSelected.filter(item => item !== id);
      } 
      
      // If selecting, add to selection
      return [...prevSelected, id];
    });
  };

  const handleSubmit = async () => {
    if (selectedParticipants.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare the announcement data
      const announcementData = {
        title,
        content: announcementText,
        type: activeTab === 'text' ? 'text' : 'image',
        recipients: selectedParticipants,
        image: selectedImage || undefined,
        imageCaption: imageCaption || undefined
      };
      
      // Call API to create announcement
      await announcementsAPI.createAnnouncement(announcementData);
      
      // Close modal on success
      handleClose();
    } catch (err) {
      setError('Failed to create announcement. Please try again.');
      console.error('Error creating announcement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => {
    return (
      <div className="rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title || "Announcement Title"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {announcementDate}
          </p>
        </div>
        
        <div className="p-4">
          {activeTab === 'text' ? (
            <div className="prose dark:prose-invert max-w-none">
              {announcementText ? (
                <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                  {announcementText}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">
                  Your message will appear here...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {previewUrl ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                      <img 
                        src={previewUrl} 
                        alt="Announcement" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  {imageCaption && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center italic">
                      {imageCaption}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Your announcement image will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          {step === 'participants' ? (
            <span>
              Recipients: {selectedParticipants.includes('everyone') 
              ? 'All Users' 
              : `${selectedParticipants.length} selected`}
            </span>
          ) : (
            <span>Preview Mode</span>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header with step indicator */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Create Announcement
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress steps */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center z-10">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors",
                step === 'content' 
                  ? "bg-violet-600 text-white" 
                  : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
              )}>
                1
              </div>
              <span className={cn(
                "ml-2 text-sm font-medium transition-colors",
                step === 'content' 
                  ? "text-violet-600 dark:text-violet-400" 
                  : "text-gray-500 dark:text-gray-400"
              )}>
                Content
              </span>
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 top-4 h-0.5 w-[30%] bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="flex items-center z-10">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors",
                step === 'participants' 
                  ? "bg-violet-600 text-white" 
                  : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
              )}>
                2
              </div>
              <span className={cn(
                "ml-2 text-sm font-medium transition-colors",
                step === 'participants' 
                  ? "text-violet-600 dark:text-violet-400" 
                  : "text-gray-500 dark:text-gray-400"
              )}>
                Recipients
              </span>
            </div>
          </div>
        </div>

        {/* Main content area - conditionally render based on step */}
        <AnimatePresence mode="wait">
          {step === 'content' ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col md:flex-row flex-1 overflow-y-auto max-h-[70vh]"
            >
              {/* Form Section */}
              <div className="md:w-1/2 p-6 overflow-y-auto">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter a title for your announcement"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                    maxLength={100}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {title.length}/100 characters
                  </p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-4">
                  <div className="flex space-x-4 items-center">
                    <button
                      onClick={() => handleTabChange('text')}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm transition-colors flex-1",
                        activeTab === 'text'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/30"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          <span className="font-medium">Basic</span>
                        </div>
                        <span className="text-xs mt-1 opacity-80">Simple text-only announcement</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleTabChange('image')}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm transition-colors flex-1",
                        activeTab === 'image'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/30"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Image</span>
                        </div>
                        <span className="text-xs mt-1 opacity-80">Image-focused announcement</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Content based on active tab */}
                <div className="mt-4">
                  {activeTab === 'text' ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="announcementText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Message*
                        </label>
                        <textarea
                          id="announcementText"
                          value={announcementText}
                          onChange={handleTextChange}
                          rows={8}
                          placeholder="Type your message here..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                          maxLength={1000}
                        ></textarea>
                        <p className="mt-1 text-xs text-right text-gray-500 dark:text-gray-400">
                          {announcementText.length}/1000 characters
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Announcement Image*
                        </label>
                        <div 
                          className={cn(
                            "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg cursor-pointer",
                            previewUrl 
                              ? "border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-900/10"
                              : "border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500"
                          )}
                          onClick={triggerFileInput}
                        >
                          <div className="space-y-1 text-center">
                            {previewUrl ? (
                              <div className="relative">
                                <img 
                                  src={previewUrl} 
                                  alt="Preview" 
                                  className="max-h-48 mx-auto rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(null);
                                    setPreviewUrl(null);
                                  }}
                                  className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md"
                                >
                                  <svg className="h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex justify-center text-sm text-gray-600 dark:text-gray-400">
                                  <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 focus-within:outline-none"
                                  >
                                    <span>Upload a file</span>
                                    <input
                                      id="file-upload"
                                      name="file-upload"
                                      type="file"
                                      className="sr-only"
                                      accept="image/*"
                                      ref={fileInputRef}
                                      onChange={handleImageChange}
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  PNG, JPG, GIF up to 5MB
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {previewUrl && (
                          <div className="mt-3">
                            <label htmlFor="imageCaption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Image Caption (Optional)
                            </label>
                            <textarea
                              id="imageCaption"
                              value={imageCaption}
                              onChange={handleCaptionChange}
                              rows={3}
                              placeholder="Add a caption to describe your image..."
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                              maxLength={300}
                            ></textarea>
                            <p className="mt-1 text-xs text-right text-gray-500 dark:text-gray-400">
                              {imageCaption.length}/300 characters
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Preview Section */}
              <div className="md:w-1/2 bg-gray-50 dark:bg-gray-900/20 p-6 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
                <h3 className="text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Live Preview
                </h3>
                
                {renderPreview()}
                
                <div className="mt-4 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800/30">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-violet-500 dark:text-violet-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-violet-700 dark:text-violet-300">
                      <p className="font-medium">Preview Mode</p>
                      <p className="mt-1 text-violet-600/80 dark:text-violet-400/80 text-xs">
                        This is how your announcement will look when published. Recipients will receive it exactly as shown here.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="participants"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col md:flex-row flex-1 overflow-y-auto max-h-[70vh]"
            >
              {/* Recipients Section */}
              <div className="md:w-1/2 p-6 overflow-y-auto">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Select Recipients*
                </h3>
                
                {/* Permission type indicator */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm">
                  {permissionType === 'everyone' && (
                    <div className="flex items-center text-blue-700 dark:text-blue-300">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                      </svg>
                      <span>Your announcement will be visible to everyone.</span>
                    </div>
                  )}
                  
                  {permissionType === 'byGroup' && (
                    <div className="flex items-center text-blue-700 dark:text-blue-300">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Your announcement can be sent to specific groups. Select one or more groups below.</span>
                    </div>
                  )}
                  
                  {permissionType === 'byUser' && (
                    <div className="flex items-center text-blue-700 dark:text-blue-300">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Your announcement can be sent to specific users. Select one or more users below.</span>
                    </div>
                  )}
                </div>
                
                {loadingParticipants ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 dark:border-violet-400"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(70vh-250px)] overflow-y-auto pr-1">
                    {participants.length === 0 ? (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 text-center rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No recipients found. Please contact your administrator.</p>
                      </div>
                    ) : (
                      participants.map(participant => (
                        <label 
                          key={participant.id} 
                          className={cn(
                            "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                            selectedParticipants.includes(participant.id) 
                              ? "bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30"
                              : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(participant.id)}
                            onChange={() => handleParticipantToggle(participant.id)}
                            className="sr-only"
                            disabled={permissionType === 'everyone'}
                          />
                          <div className={cn(
                            "w-5 h-5 rounded flex-shrink-0 mr-3 flex items-center justify-center border",
                            selectedParticipants.includes(participant.id)
                              ? "bg-violet-600 dark:bg-violet-500 border-transparent"
                              : "border-gray-300 dark:border-gray-600"
                          )}>
                            {selectedParticipants.includes(participant.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          <div className="flex items-center flex-1">
                            {participant.image ? (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3">
                                <img 
                                  src={participant.image} 
                                  alt={participant.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className={cn(
                                "w-8 h-8 rounded-full mr-3 flex items-center justify-center text-sm font-medium",
                                participant.type === 'group'
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                  : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                              )}>
                                {getInitials(participant.name)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {participant.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {participant.type === 'group' ? 'Group' : 'User'}
                              </p>
                            </div>
                          </div>

                          {participant.id === 'everyone' && (
                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              Everyone
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                )}

                {selectedParticipants.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg">
                    <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                      <svg className="w-5 h-5 mr-2 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-medium">
                        Announcement will be sent to {selectedParticipants.includes('everyone') 
                          ? 'all users' 
                          : `${selectedParticipants.length} recipient${selectedParticipants.length !== 1 ? 's' : ''}`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Preview Section */}
              <div className="md:w-1/2 bg-gray-50 dark:bg-gray-900/20 p-6 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
                <h3 className="text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Final Preview
                </h3>
                
                {renderPreview()}
                
                <div className="mt-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium">Ready to publish</p>
                      <p className="mt-1 text-blue-600/80 dark:text-blue-400/80 text-xs">
                        Once published, this announcement will be visible to all selected recipients and cannot be edited.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer with actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          {step === 'content' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500"
              >
                Next: Select Recipients
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePreviousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
              >
                Back to Content
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || selectedParticipants.length === 0}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500",
                  isLoading || selectedParticipants.length === 0
                    ? "bg-violet-400 dark:bg-violet-700 cursor-not-allowed" 
                    : "bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500"
                )}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Announcement'
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
