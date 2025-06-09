'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAnnouncementModal({ isOpen, onClose }: CreateAnnouncementModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [announcementText, setAnnouncementText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('text');
      setAnnouncementText('');
      setSelectedImage(null);
      setPreviewUrl(null);
      setTitle('');
      setError(null);
    }
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnnouncementText(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    // Form validation
    if (activeTab === 'text' && !announcementText.trim()) {
      setError('Please enter announcement text');
      return;
    }
    
    if (activeTab === 'image' && !selectedImage) {
      setError('Please select an image');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for your announcement');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This is a placeholder for the actual API call
      // The implementation will be added in a future PR
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white dark:from-gray-800 dark:to-gray-800">
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

        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4 items-center">
            <button
              onClick={() => handleTabChange('text')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === 'text'
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              Text
            </button>
            <button
              onClick={() => handleTabChange('image')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === 'image'
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              Image
            </button>
            <div className="flex-1"></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              Announcements will be sent to all eligible recipients
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800/30">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Announcement Title*
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

          {activeTab === 'text' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="announcementText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Announcement Text*
                </label>
                <textarea
                  id="announcementText"
                  value={announcementText}
                  onChange={handleTextChange}
                  rows={8}
                  placeholder="Type your announcement here..."
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
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="space-y-1 text-center">
                    {previewUrl ? (
                      <div className="relative">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setPreviewUrl(null);
                          }}
                          className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow"
                        >
                          <svg className="h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex justify-center text-sm text-gray-600 dark:text-gray-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 focus-within:outline-none"
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </>
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
                      rows={3}
                      placeholder="Add a caption to describe your image..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                      maxLength={300}
                    ></textarea>
                    <p className="mt-1 text-xs text-right text-gray-500 dark:text-gray-400">
                      0/300 characters
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md mr-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500",
              isLoading 
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
        </div>
      </motion.div>
    </div>
  );
}
