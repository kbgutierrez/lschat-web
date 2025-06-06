'use client';

import React, { useState, useRef, memo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MessageInputProps {
  onSendMessage: (message: string, file?: File) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput = memo(function MessageInput({ 
  onSendMessage, 
  onTypingChange,
  disabled = false 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
    
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedFile]);

  const handleSubmit = () => {
    if ((!message.trim() && !selectedFile) || disabled || isUploading) return;
    
    setIsUploading(true);
    
    try {
      onSendMessage(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
    
    if (onTypingChange && isTyping) {
      setIsTyping(false);
      onTypingChange(false);
    }
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    if (onTypingChange) {
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        onTypingChange(true);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTypingChange(false);
        }
      }, 2000);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const openImagePreview = () => {
    if (previewUrl) {
      setShowImagePreview(true);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };
  
  const closeImagePreview = () => {
    setShowImagePreview(false);
  };
  
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFullScreen = () => {
    if (previewContainerRef.current?.requestFullscreen) {
      previewContainerRef.current.requestFullscreen();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) { 
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - position.x, 
        y: e.clientY - position.y 
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) { 
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container || !showImagePreview) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setScale(prev => Math.min(prev + 0.1, 5));
      } else {
        setScale(prev => Math.max(prev - 0.1, 0.5));
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [showImagePreview]);
  
  useEffect(() => {
    if (!showImagePreview) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || (e.key === '=' && e.shiftKey)) {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'f') {
        handleFullScreen();
      } else if (e.key === 'Escape') {
        closeImagePreview();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImagePreview]);
  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-auto min-h-[80px] shrink-0 bg-white dark:bg-gray-900 border-t border-violet-100 dark:border-gray-800 p-4">
      {selectedFile && (
        <div className="mb-2 p-2 bg-violet-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            {previewUrl ? (
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 relative mr-3 flex-shrink-0 rounded-md overflow-hidden border border-violet-200 dark:border-violet-900 cursor-pointer hover:opacity-90 transition-opacity group"
                  onClick={openImagePreview}
                >
                  <Image 
                    src={previewUrl}
                    alt="Image preview"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-md"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white bg-black/50 px-1 py-0.5 rounded">Preview</span>
                  </div>
                </div>
                <span className="text-sm truncate">{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <div className="w-6 h-6 flex-shrink-0 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-violet-600 dark:text-violet-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <span className="text-sm truncate">{selectedFile.name}</span>
              </>
            )}
          </div>
          <button 
            onClick={removeSelectedFile}
            className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
            aria-label="Remove file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Enhanced Image Preview Modal that matches ChatArea */}
      {showImagePreview && previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setShowImagePreview(false)}
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <div 
            ref={previewContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              ref={imageRef}
              src={previewUrl}
              alt={selectedFile?.name || "Preview"}
              className="max-w-none max-h-none transition-transform duration-100"
              style={{ 
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                objectFit: 'contain',
              }}
              draggable={false}
            />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <button
                className="p-2 text-white hover:bg-white/20 rounded-full"
                onClick={(e) => {e.stopPropagation(); handleZoomOut();}}
                title="Zoom Out (- key)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <div className="text-white text-sm min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </div>
              
              <button
                className="p-2 text-white hover:bg-white/20 rounded-full"
                onClick={(e) => {e.stopPropagation(); handleZoomIn();}}
                title="Zoom In (+ key)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              <button
                className="p-2 text-white hover:bg-white/20 rounded-full"
                onClick={(e) => {e.stopPropagation(); handleResetZoom();}}
                title="Reset View (0 key)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </button>
              
              <button
                className="p-2 text-white hover:bg-white/20 rounded-full"
                onClick={(e) => {e.stopPropagation(); handleFullScreen();}}
                title="Full Screen (f key)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </button>
            </div>
            
            <button
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              onClick={(e) => {e.stopPropagation(); setShowImagePreview(false);}}
              title="Close (Esc key)"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {selectedFile?.name && (
              <div className="absolute top-4 left-4 max-w-[50%] bg-black/50 text-white text-sm px-3 py-1 rounded-md backdrop-blur-sm truncate">
                {selectedFile.name}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <button 
          onClick={handleAttachmentClick}
          disabled={disabled || isUploading}
          className={cn(
            "p-2 rounded-full", 
            disabled || isUploading
              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
              : "text-black dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-gray-800"
          )}
          aria-label="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder={selectedFile ? "Add a comment or send without text" : "Type a message"}
            className="w-full py-3 px-4 bg-violet-50 dark:bg-gray-800 rounded-full border-0 focus:ring-2 focus:ring-violet-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            disabled={disabled || isUploading}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={(!message.trim() && !selectedFile) || disabled || isUploading}
          className={cn(
            "p-3 rounded-full text-white",
            (!message.trim() && !selectedFile) || disabled || isUploading
              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-700"
          )}
          aria-label="Send message"
        >
          {isUploading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
});
