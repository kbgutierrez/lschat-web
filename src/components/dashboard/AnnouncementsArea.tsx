'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Announcement } from '@/lib/announcementsApi';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';

interface AnnouncementsAreaProps {
  announcement: Announcement | null;
  loading?: boolean;
  error?: string | null;
}

export function AnnouncementsArea({
  announcement,
  loading = false,
  error = null
}: AnnouncementsAreaProps) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Add state for tracking image dimensions and loading state
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  
  // Handle image loading to determine dimensions and aspect ratio
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageLoaded(true);
    setImageError(false);
  }, []);
  
  // Handle image loading errors
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);
  
  // Calculate container width and viewport height on mount and resize
  useEffect(() => {
    if (!announcement?.main_image_url) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
        // Get the effective viewport height (accounting for the container's position)
        setViewportHeight(window.innerHeight * 0.8); // Use 80% of viewport as max height
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [announcement?.main_image_url]);
  
  // Calculate image display dimensions - prioritizing original size but fitting viewport
  const getOptimalImageDimensions = useCallback(() => {
    if (!imageDimensions) return { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '65vh' };
    
    const { width, height } = imageDimensions;
    const aspectRatio = width / height;
    
    // Calculate available space (accounting for padding)
    const availableWidth = containerWidth > 0 ? containerWidth - 32 : 600;
    const availableHeight = viewportHeight > 0 ? viewportHeight - 100 : 500; 
    
    // If image fits comfortably within viewport, display at original size
    if (width <= availableWidth && height <= availableHeight) {
      return { 
        width: width,
        height: height
      };
    }
    
    // Otherwise, calculate scaled dimensions that maintain aspect ratio
    let scaledWidth = width;
    let scaledHeight = height;
    
    // If width exceeds available width, scale proportionally
    if (width > availableWidth) {
      scaledWidth = availableWidth;
      scaledHeight = availableWidth / aspectRatio;
    }
    
    // If height still exceeds available height, scale again
    if (scaledHeight > availableHeight) {
      scaledHeight = availableHeight;
      scaledWidth = availableHeight * aspectRatio;
    }
    
    return {
      width: Math.round(scaledWidth),
      height: Math.round(scaledHeight)
    };
  }, [imageDimensions, containerWidth, viewportHeight]);

  // Existing code for zoom functionality
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);
  
  const handleReset = useCallback(() => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);
  
  const handleImageClick = useCallback(() => {
    if (announcement?.main_image_url) {
      setImageViewerOpen(true);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [announcement]);
  
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Get calculated image style
  const imageStyle = getOptimalImageDimensions();

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3 md:py-6 md:px-4">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading announcement</h3>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          ) : announcement ? (
            <div className="animate-fade-in">
              {/* Announcement Card with reduced white space */}
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                {/* Announcement Header - more compact design */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center">
                  {announcement.profile_picture ? (
                    <img 
                      src={announcement.profile_picture} 
                      alt={announcement.creator_name}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-white dark:ring-gray-700 mr-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=' + announcement.creator_name.charAt(0).toUpperCase();
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-800 flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {announcement.creator_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-lg font-medium text-gray-900 dark:text-white leading-tight tracking-tight">
                      {announcement.title}
                    </h1>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="font-medium text-violet-600 dark:text-violet-400">
                        {announcement.creator_name}
                      </span>
                      <span className="mx-1.5">•</span>
                      <span>
                        {new Date(announcement.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Announcement Content with adaptive image display */}
                <div className="px-3 py-3 md:px-4 md:py-4">
                  {announcement.announcement_type === 'image' ? (
                    <div>
                      {announcement.main_image_url && (
                        <div className="mb-4" ref={containerRef}>
                          <div 
                            onClick={handleImageClick} 
                            className={cn(
                              "relative overflow-hidden cursor-zoom-in rounded-md transition-all hover:shadow-lg mx-auto text-center",
                              imageLoaded ? "bg-transparent" : "bg-gray-50 dark:bg-gray-900/50 min-h-[200px]"
                            )}
                            style={{
                              display: 'flex',
                              justifyContent: 'center'
                            }}
                          >
                            {!imageLoaded && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-pulse inline-block w-8 h-8 border-4 border-violet-300 dark:border-violet-700 border-t-transparent dark:border-t-transparent rounded-full"></div>
                              </div>
                            )}
                            
                            <img 
                              src={`${API_BASE_URL}${announcement.main_image_url}`} 
                              alt={announcement.title}
                              className={cn(
                                "transition-all",
                                imageLoaded ? "opacity-100" : "opacity-0",
                                imageError ? "hidden" : "block"
                              )}
                              style={{
                                ...imageStyle,
                                objectFit: 'contain'
                              }}
                              onLoad={handleImageLoad}
                              onError={handleImageError}
                            />
                            
                            {imageError && (
                              <div className="py-8 text-center bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load image</p>
                              </div>
                            )}
                            
                            {imageLoaded && !imageError && (
                              <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity flex items-center justify-center">
                                <svg className="w-8 h-8 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Removed image dimensions display */}
                        </div>
                      )}
                      {announcement.content && (
                        <div className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {announcement.content}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-violet dark:prose-invert max-w-none">
                      {announcement.content && (
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {announcement.content}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Attachment section - more compact */}
                  {announcement.attachment_url && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center p-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                        <div className="bg-violet-100 dark:bg-violet-900/30 p-2 rounded-full mr-3">
                          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {announcement.attachment_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {announcement.attachment_mime_type}
                          </p>
                        </div>
                        <a 
                          href={`${API_BASE_URL}${announcement.attachment_url}`}
                          download={announcement.attachment_name}
                          className="ml-2 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-sm font-medium rounded-md hover:bg-violet-200 dark:hover:bg-violet-900/50 shadow-sm transition-colors duration-150 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center max-w-md mx-auto">
                <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-200">No announcement selected</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">Select an announcement from the sidebar to view its details here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Image Viewer Modal with Zoom Controls */}
      <AnimatePresence>
        {imageViewerOpen && announcement?.main_image_url && (
          <motion.div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={handleZoomIn}
                className="p-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full"
                aria-label="Zoom in"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full"
                aria-label="Zoom out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h10" />
                </svg>
              </button>
              <button 
                onClick={handleReset}
                className="p-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full"
                aria-label="Reset zoom"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button 
                onClick={() => setImageViewerOpen(false)}
                className="p-2 bg-gray-800/80 hover:bg-red-700/80 text-white rounded-full"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <motion.div 
              className="w-full h-full flex items-center justify-center overflow-hidden select-none"
              drag={zoomLevel > 1}
              dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
              dragElastic={0.1}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              style={{ 
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <div 
                className="relative"
                style={{ 
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                <img 
                  src={`${API_BASE_URL}${announcement.main_image_url}`}
                  alt={announcement.title || "Announcement image"}
                  className="max-h-[85vh] max-w-[85vw] object-contain"
                  draggable="false"
                />
              </div>
            </motion.div>
            
            {/* Image zoom info overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
              {Math.round(zoomLevel * 100)}% {zoomLevel > 1 ? '(drag to pan)' : ''}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
