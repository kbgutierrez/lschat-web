'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Announcement, announcementsAPI } from '@/lib/announcementsApi';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

interface AnnouncementsAreaProps {
  announcement: Announcement | null;
  loading?: boolean;
  error?: string | null;
  isPublished?: boolean; // Whether this is a published announcement
  userId?: string | number | null; // Current user ID
  onStatusChange?: (announcementId: number, newStatus: number) => Promise<void>; // Callback when status changes
}

export function AnnouncementsArea({
  announcement,
  loading = false,
  error = null,
  isPublished = false,
  userId = null,
  onStatusChange
}: AnnouncementsAreaProps) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [localActiveStatus, setLocalActiveStatus] = useState<number | null>(null);
  const [isConfirmingStatusChange, setIsConfirmingStatusChange] = useState(false);
  const [pendingNewStatus, setPendingNewStatus] = useState<number | null>(null);

  // Initialize local status from announcement when it loads
  useEffect(() => {
    if (announcement) {
      // Convert boolean to number if needed
      const activeStatus = typeof announcement.is_active === 'boolean'
        ? (announcement.is_active ? 1 : 0)
        : Number(announcement.is_active);
      setLocalActiveStatus(activeStatus);
    }
  }, [announcement]);

  // Format date without any ordinal suffixes
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Get formatted date parts
    const year = date.getFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    // Return formatted date without any ordinal suffixes
    return `${month} ${day}, ${year}, ${hour12}:${minutes} ${ampm}`;
  };

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);
  
  const handleReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Show confirmation dialog when status toggle is clicked
  const handleToggleClick = useCallback(() => {
    if (!announcement || !userId || isUpdatingStatus) return;

    const newStatus = localActiveStatus === 1 ? 0 : 1;
    setPendingNewStatus(newStatus);
    setIsConfirmingStatusChange(true);
  }, [announcement, userId, isUpdatingStatus, localActiveStatus]);

  // Handle the actual status change when confirmed
  const handleToggleStatus = useCallback(async () => {
    if (!announcement || !userId || isUpdatingStatus || pendingNewStatus === null) return;

    try {
      setIsUpdatingStatus(true);
      setStatusUpdateError(null);
      setIsConfirmingStatusChange(false);
      
      // Update local state optimistically
      setLocalActiveStatus(pendingNewStatus);
      
      // Call the API to update status
      const result = await announcementsAPI.updateAnnouncementStatus(
        announcement.announcement_id,
        pendingNewStatus,
        userId
      );
      
      if (!result.success) {
        // Revert on failure
        setLocalActiveStatus(typeof announcement.is_active === 'boolean'
          ? (announcement.is_active ? 1 : 0)
          : Number(announcement.is_active));
        setStatusUpdateError(result.message || 'Failed to update status');
        return;
      }
      
      // Notify parent component to refresh announcements list
      if (onStatusChange) {
        await onStatusChange(announcement.announcement_id, pendingNewStatus);
      }
    } catch (error) {
      console.error('Error updating announcement status:', error);
      setLocalActiveStatus(typeof announcement.is_active === 'boolean'
        ? (announcement.is_active ? 1 : 0)
        : Number(announcement.is_active));
      setStatusUpdateError(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
      setPendingNewStatus(null);
    }
  }, [announcement, userId, isUpdatingStatus, pendingNewStatus, onStatusChange]);

  // Handle cancellation of status change
  const handleCancelStatusChange = useCallback(() => {
    setIsConfirmingStatusChange(false);
    setPendingNewStatus(null);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-6">
        {loading ? (
          <div className="w-full max-w-4xl mx-auto px-4">
            <div className="animate-pulse space-y-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="flex gap-2 items-center mt-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
              <div className="h-48 bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded mt-3"></div>
              <div className="space-y-2 mt-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full max-w-4xl mx-auto px-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 shadow-sm border border-red-100 dark:border-red-800/30">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-red-100 dark:bg-red-800/30 rounded-full p-2">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-300">Unable to load announcement</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : announcement ? (
          <article className="w-full sm:w-[95%] md:w-[90%] lg:w-[85%] xl:w-[80%] mx-auto px-4">
            {/* Bulletin board style announcement */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Status toggle for published announcements */}
              {isPublished && announcement && (
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
                      Status:
                    </span>
                    {statusUpdateError && (
                      <div className="text-xs text-red-600 dark:text-red-400 mr-3">
                        {statusUpdateError}
                      </div>
                    )}
                    <span 
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        localActiveStatus === 1 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400"
                      )}
                    >
                      {localActiveStatus === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {isConfirmingStatusChange ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {pendingNewStatus === 1 ? 'Activate' : 'Deactivate'} announcement?
                      </span>
                      <button
                        onClick={handleCancelStatusChange}
                        className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleToggleStatus}
                        className={cn(
                          "px-2 py-1 text-xs rounded text-white transition-colors",
                          pendingNewStatus === 1 
                            ? "bg-green-500 hover:bg-green-600" 
                            : "bg-red-500 hover:bg-red-600"
                        )}
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleToggleClick}
                      disabled={isUpdatingStatus}
                      className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                        localActiveStatus === 1 ? "bg-green-600" : "bg-gray-400 dark:bg-gray-600"
                      )}
                    >
                      <span className="sr-only">Toggle announcement status</span>
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          localActiveStatus === 1 ? "translate-x-5" : "translate-x-0"
                        )}
                      ></span>
                      {isUpdatingStatus && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Colored tag strip based on announcement type */}
              <div className={cn(
                "h-1.5",
                announcement.announcement_type === 'image' 
                  ? "bg-blue-500 dark:bg-blue-600" 
                  : "bg-violet-500 dark:bg-violet-600"
              )}></div>
              
              <div className="p-4 md:p-5">
                {/* Compact header with metadata */}
                <div className="mb-4">
                  {/* Title - smaller and more appropriate for a bulletin */}
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {announcement.title}
                  </h1>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {announcement.profile_picture ? (
                        <img 
                          src={announcement.profile_picture} 
                          alt={announcement.creator_name}
                          className="h-7 w-7 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=' + announcement.creator_name.charAt(0).toUpperCase();
                          }}
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                          {announcement.creator_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-gray-700 dark:text-gray-300">{announcement.creator_name}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Thin separator */}
                <hr className="border-gray-100 dark:border-gray-700 mb-4" />
                
                {/* Content area */}
                <div className="space-y-4">
                  {announcement.announcement_type === 'image' ? (
                    <>
                      {announcement.main_image_url && (
                        <div 
                          onClick={() => setImageViewerOpen(true)}
                          className="cursor-zoom-in rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 mb-6"
                        >
                          <div className="relative group">
                            <img 
                              src={`${API_BASE_URL}${announcement.main_image_url}`} 
                              alt={announcement.title}
                              className="w-full object-contain max-h-[500px] mx-auto" 
                              style={{ minHeight: "200px" }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                              <div className="px-3 py-1.5 bg-black/50 text-white text-xs rounded-md backdrop-blur-sm flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                                View Full Size
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {announcement.content && (
                        <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                          {announcement.content}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                      {announcement.content || <span className="text-gray-500 dark:text-gray-400 italic">No content provided</span>}
                    </div>
                  )}
                  
                  {/* Attachment */}
                  {announcement.attachment_url && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <a 
                        href={`${API_BASE_URL}${announcement.attachment_url}`}
                        download={announcement.attachment_name}
                        className="block bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors group"
                      >
                        <div className="p-3 flex items-center">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md mr-3 text-gray-500 dark:text-gray-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {announcement.attachment_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {announcement.attachment_mime_type}
                            </p>
                          </div>
                          <div className="ml-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download</span>
                          </div>
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer with update info - without ID */}
              {announcement.updated_at && announcement.updated_at !== announcement.created_at && (
                <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Updated: {formatDate(announcement.updated_at)}</span>
                  </div>
                </div>
              )}
            </div>
          </article>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md bg-white dark:bg-gray-800 px-6 py-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-4 bg-gray-100 dark:bg-gray-700 rounded-full p-3 inline-flex">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">No announcement selected</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select an announcement from the list to view its content
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Simple Image Viewer */}
      {imageViewerOpen && announcement?.main_image_url && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setImageViewerOpen(false)}
        >
          {/* Controls */}
          <div 
            className="absolute top-3 right-3 flex items-center bg-black/50 rounded-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={handleZoomIn} className="p-2 text-white/90 hover:bg-white/10" aria-label="Zoom in">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            <button onClick={handleZoomOut} className="p-2 text-white/90 hover:bg-white/10" aria-label="Zoom out">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h10" />
              </svg>
            </button>
            <button onClick={handleReset} className="p-2 text-white/90 hover:bg-white/10" aria-label="Reset zoom">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="w-px h-4 bg-white/20"></div>
            <button onClick={() => setImageViewerOpen(false)} className="p-2 text-white/90 hover:bg-red-500/50" aria-label="Close">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Image */}
          <img 
            src={`${API_BASE_URL}${announcement.main_image_url}`}
            alt={announcement.title || "Announcement image"}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded shadow-xl"
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease' }}
            onClick={e => e.stopPropagation()}
          />
          
          {/* Zoom level indicator */}
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/50 text-white text-xs rounded">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
