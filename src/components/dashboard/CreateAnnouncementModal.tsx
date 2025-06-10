'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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

const getInitials = (name: string): string => {
  if (!name) return '';
  
  const nameParts = name.trim().split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 0) return '';
  
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

export default function CreateAnnouncementModal({ isOpen, onClose }: CreateAnnouncementModalProps) {
  const [step, setStep] = useState<Step>('content');
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [title, setTitle] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState(false);
  
  const [permissionType, setPermissionType] = useState<'everyone' | 'byGroup' | 'byUser'>('everyone');
  const [participants, setParticipants] = useState<AnnouncementParticipant[]>(
    [{ id: 'everyone', name: 'All Users', type: 'user' }]
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(['everyone']);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [titleError, setTitleError] = useState(false);
  const [announcementTextError, setAnnouncementTextError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const filteredParticipants = useMemo(() => {
    if (!searchTerm.trim()) return participants;
    
    const term = searchTerm.toLowerCase().trim();
    return participants.filter(participant => 
      participant.name.toLowerCase().includes(term)
    );
  }, [participants, searchTerm]);

  const handleSelectAll = () => {
    if (permissionType === 'everyone') return;
    
    const areAllSelected = filteredParticipants.every(p => 
      selectedParticipants.includes(p.id)
    );
    
    if (areAllSelected) {
      setSelectedParticipants([]);
    } else {
      const visibleIds = filteredParticipants.map(p => p.id);
      setSelectedParticipants(visibleIds);
    }
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null); // Add this line

  const announcementDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
            
            const currentUserId = `user_${user.user_id}`;
            const currentUserParticipant = newParticipants.find(p => p.id === currentUserId);
            
            if (currentUserParticipant) {
              initialSelection = [currentUserId];
            } else if (newParticipants.length > 0) {
              initialSelection = [newParticipants[0].id];
            }
          }
          
          setParticipants(newParticipants);
          setSelectedParticipants(initialSelection);
        } catch (err) {
          console.error('Error fetching announcement permissions:', err);
          setError('Failed to load announcement recipients. Please try again.');
          setParticipants([{ id: 'everyone', name: 'All Users', type: 'user' }]);
          setSelectedParticipants(['everyone']);
        } finally {
          setLoadingParticipants(false);
        }
      };
      
      fetchPermissions();
    }
  }, [isOpen]);

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
      setSuccess(false);
      setShowConfirmation(false); // Reset confirmation dialog state
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleClose = () => {
    if (!isLoading) {
      setSuccess(false);
      setShowConfirmation(false);
      onClose();
    }
  };

  const handleTabChange = (tab: 'text' | 'image') => {
    setActiveTab(tab);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerAttachmentInput = () => {
    attachmentInputRef.current?.click();
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
      
      if (file.size > 5 * 1024 * 1024) {
        setImageError(true);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setImageError(true);
        return;
      }
      
      setSelectedImage(file);
      setImageError(false);
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
    }
  };

  // Add a handler for attachment file selection
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        setAttachmentError(true);
        return;
      }
      
      setSelectedAttachment(file);
      setAttachmentError(false);
    }
  };

  const handleRemoveAttachment = () => {
    setSelectedAttachment(null);
  };

  const handleNextStep = () => {
    if (title.trim() === '') {
      setTitleError(true);
      return;
    } else {
      setTitleError(false);
    }
    
    if (activeTab === 'text' && announcementText.trim() === '') {
      setAnnouncementTextError(true);
      return;
    } else {
      setAnnouncementTextError(false);
    }
    
    if (activeTab === 'image' && !selectedImage) {
      setImageError(true);
      return;
    } else {
      setImageError(false);
    }

    if (selectedAttachment && selectedAttachment.size > 10 * 1024 * 1024) {
      setAttachmentError(true);
      return;
    } else {
      setAttachmentError(false);
    }
    
    setError(null);
    setStep('participants');
  };

  const handlePreviousStep = () => {
    setStep('content');
  };

  const handleParticipantToggle = (id: string) => {
    if (permissionType === 'everyone') {
      return;
    }
    
    setSelectedParticipants(prevSelected => {
      if (prevSelected.includes(id)) {
        if (prevSelected.length === 1) {
          return prevSelected;
        }
        return prevSelected.filter(item => item !== id);
      } 
      
      return [...prevSelected, id];
    });
  };

  const handleSubmit = async () => {
    if (selectedParticipants.length === 0) {
      setError('Please select at least one recipient');
      return;
    }
    
    // Show confirmation dialog instead of directly submitting
    setShowConfirmation(true);
  };
  
  const handleConfirmedSubmit = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const announcementData = {
        title,
        content: announcementText,
        type: activeTab === 'text' ? 'text' : 'image',
        recipients: selectedParticipants,
        image: selectedImage || undefined,
        imageCaption: imageCaption || undefined,
        attachment: selectedAttachment || undefined
      };
      
      const response = await announcementsAPI.createAnnouncement(announcementData);
      console.log('Announcement created successfully:', response);
      
      setSuccess(true);
      
      // Close the modal after showing success message for 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
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
          {step === 'participants' && (
            <span>
              Recipients: {selectedParticipants.includes('everyone') 
              ? 'All Users' 
              : `${selectedParticipants.length} selected`}
            </span>
          )}
        </div>

        {/* Show attachment info in preview if present */}
        {activeTab === 'image' && previewUrl && selectedAttachment && (
          <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-md flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Attachment: {selectedAttachment.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(selectedAttachment.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}
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

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {showConfirmation && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4 p-6"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
                    <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Create Announcement?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Are you sure you want to publish this announcement? 
                    {selectedParticipants.includes('everyone') 
                      ? ' It will be sent to all users.' 
                      : ` It will be sent to ${selectedParticipants.length} recipient${selectedParticipants.length !== 1 ? 's' : ''}.`}
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowConfirmation(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmedSubmit}
                      className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500"
                    >
                      Yes, Create Announcement
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success Alert Modal */}
        <AnimatePresence>
          {success && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4 p-6 border border-green-200 dark:border-green-900/30"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Announcement Created!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Your announcement has been successfully published to all selected recipients.
                  </p>
                  <div className="animate-pulse flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Closing in a moment...
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 p-4 mx-6 mt-4 rounded"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                {/* Remove the fixed height error container */}

                {/* Tab Navigation - Moved above title */}
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

                <div className="mb-4 relative">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter a title for your announcement"
                    className={cn(
                      "w-full px-4 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100",
                      titleError ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-600"
                    )}
                    maxLength={100}
                  />
                  {titleError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Please enter a title for your announcement
                    </p>
                  )}
                </div>

                {/* Content based on active tab */}
                <div className="mt-4">
                  {activeTab === 'text' ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <label htmlFor="announcementText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Message*
                        </label>
                        <textarea
                          id="announcementText"
                          value={announcementText}
                          onChange={handleTextChange}
                          rows={8}
                          placeholder="Type your message here..."
                          className={cn(
                            "w-full px-4 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100",
                            announcementTextError && activeTab === 'text' && announcementText.trim() === '' ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-600"
                          )}
                          maxLength={1000}
                        ></textarea>
                        <p className="mt-1 text-xs text-right text-gray-500 dark:text-gray-400">
                          {announcementText.length}/1000 characters
                        </p>
                        
                        <AnimatePresence>
                          {announcementTextError && activeTab === 'text' && announcementText.trim() === '' && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Please enter message
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Announcement Image*
                        </label>
                        
                        {!previewUrl ? (
                          <div 
                            onClick={triggerFileInput} 
                            className="cursor-pointer py-10 px-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 rounded-lg"
                          >
                            <div className="mb-4">
                              <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                                Click to select an image
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                PNG, JPG or GIF up to 5MB
                              </p>
                            </div>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleImageChange}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-2">
                            {/* Thumbnail container */}
                            <div className="relative h-20 w-full rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 flex">
                              {/* Thumbnail image */}
                              <div className="h-full w-20 bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                                <img 
                                  src={previewUrl} 
                                  alt="Selected image" 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              
                              {/* Image info */}
                              <div className="flex-1 p-2 flex flex-col justify-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-full font-medium">
                                  {selectedImage?.name || 'Selected image'}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Image will appear in full size in the preview
                                </p>
                              </div>
                            </div>
                            
                            {/* More subtle action buttons at the bottom */}
                            <div className="flex items-center justify-end space-x-2 px-1">
                              <button
                                type="button"
                                onClick={triggerFileInput}
                                className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 text-violet-600 dark:text-violet-400 rounded hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors inline-flex items-center"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedImage(null);
                                  setPreviewUrl(null);
                                }}
                                className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 text-red-500 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors inline-flex items-center"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <AnimatePresence>
                          {imageError && activeTab === 'image' && !selectedImage && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Please select an image
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
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

                      {/* Add attachment upload section */}
                      {previewUrl && (
                        <div className="mt-5">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Attachment (Optional)
                          </label>
                          
                          {!selectedAttachment ? (
                            <div 
                              onClick={triggerAttachmentInput} 
                              className="cursor-pointer py-4 px-6 flex items-center justify-center space-x-3 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-dashed border-gray-300 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 rounded-lg"
                            >
                              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <div className="text-left">
                                <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                                  Click to add an attachment
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  PDF, DOCX, XLSX, etc. up to 10MB
                                </p>
                              </div>
                              <input
                                id="attachment-upload"
                                name="attachment-upload"
                                type="file"
                                className="sr-only"
                                ref={attachmentInputRef}
                                onChange={handleAttachmentChange}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex-shrink-0 mr-3">
                                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                                  <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {selectedAttachment.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {(selectedAttachment.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveAttachment}
                                className="ml-2 p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-red-900/10"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                          
                          <AnimatePresence>
                            {attachmentError && (
                              <motion.div 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Attachment file is too large. Maximum size is 10MB.
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
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
                
                {/* Remove the redundant preview explanation box */}
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
                {/* Replace error container with inline errors */}
                
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Select Recipients*
                </h3>
                
                {/* Permission type indicator */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm relative">
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
                
                {/* Redesigned Search and Selection UI with stable layout */}
                {permissionType !== 'everyone' && (
                  <div className="mb-4 space-y-1">
                    <div className="flex items-center justify-between mb-1.5 h-6">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                        {selectedParticipants.length > 0 ? `${selectedParticipants.length} selected` : "Select recipients"}
                      </div>
                      <div className="w-20 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAll();
                          }}
                          type="button"
                          className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                        >
                          {filteredParticipants.every(p => selectedParticipants.includes(p.id)) ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                    </div>
                    
                    {/* Search bar */}
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 start-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search recipients..."
                        className="w-full p-2.5 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label="Clear search"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Search results status */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-1 h-5">
                      {filteredParticipants.length !== participants.length ? 
                        `${filteredParticipants.length} matching out of ${participants.length} total recipients` : 
                        `${participants.length} total recipients`}
                    </div>
                  </div>
                )}
                
                {loadingParticipants ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 dark:border-violet-400"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(70vh-300px)] overflow-y-auto pr-1">
                    {filteredParticipants.length === 0 ? (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 text-center rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'No recipients match your search.' : 'No recipients found. Please contact your administrator.'}
                        </p>
                      </div>
                    ) : (
                      filteredParticipants.map(participant => (
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Final Preview
                </h3>
                
                {renderPreview()}
                
                {/* Remove the redundant preview explanation box */}
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
                disabled={isLoading || selectedParticipants.length === 0 || success || showConfirmation}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500",
                  (isLoading || selectedParticipants.length === 0 || success || showConfirmation)
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
                ) : success ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Closing...
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
