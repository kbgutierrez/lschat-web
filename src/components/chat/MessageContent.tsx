'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type MessageContentProps = {
  content: string;
  className?: string;
};

const IMAGE_PATTERN = /\[Image:\s*(https?:\/\/[^\]\s]+)\]/i;
const IMAGE_FILE_PATTERN = /\[(JPG|PNG|GIF|JPEG) File:\s*([^-\]]+)\s*-\s*(https?:\/\/[^\]\s]+)\]/i;
const FILE_PATTERN = /\[File:\s*(https?:\/\/[^\|\]\s]+)\|([^\]\s]+)\]/i;

export const MessageContent: React.FC<MessageContentProps> = ({ content, className }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageFileMatch = content.match(IMAGE_FILE_PATTERN);
  if (imageFileMatch && imageFileMatch[3]) {
    const imageType = imageFileMatch[1].toLowerCase();
    const fileName = imageFileMatch[2].trim();
    const imageUrl = imageFileMatch[3];
    
    return (
      <div className={cn("relative", className)}>
        {!imageLoaded && !imageError && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4 min-h-[200px] animate-pulse">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">Loading {fileName}...</p>
          </div>
        )}
        
        {imageError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <svg className="w-6 h-6 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load image</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{fileName}</p>
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
            >
              Download {imageType.toUpperCase()}
            </a>
          </div>
        ) : (
          <div 
            className={cn(
              "overflow-hidden rounded-lg transition-opacity", 
              !imageLoaded && "opacity-0",
              imageLoaded && "opacity-100"
            )}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{fileName}</div>
            <img
              src={imageUrl}
              alt={fileName}
              className="max-w-full rounded-lg object-contain"
              style={{ maxHeight: '300px' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        )}
      </div>
    );
  }

  const imageMatch = content.match(IMAGE_PATTERN);
  if (imageMatch && imageMatch[1]) {
    const imageUrl = imageMatch[1];
    return (
      <div className={cn("relative", className)}>
        {!imageLoaded && !imageError && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center p-4 min-h-[200px] animate-pulse">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {imageError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <svg className="w-6 h-6 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load image</p>
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
            >
              Open original
            </a>
          </div>
        ) : (
          <div 
            className={cn(
              "overflow-hidden rounded-lg transition-opacity", 
              !imageLoaded && "opacity-0",
              imageLoaded && "opacity-100"
            )}
          >
            <img
              src={imageUrl}
              alt="Message attachment"
              className="max-w-full rounded-lg object-contain"
              style={{ maxHeight: '300px' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        )}
      </div>
    );
  }

  const fileMatch = content.match(FILE_PATTERN);
  if (fileMatch && fileMatch[1] && fileMatch[2]) {
    const fileUrl = fileMatch[1];
    const fileName = fileMatch[2];
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    
    const getFileIcon = () => {
      switch(fileExt) {
        case 'pdf':
          return (
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          );
        case 'doc':
        case 'docx':
          return (
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          );
        case 'xls':
        case 'xlsx':
          return (
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          );
        default:
          return (
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          );
      }
    };
    
    return (
      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="mr-3">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {fileExt.toUpperCase()} File
          </p>
        </div>
        <a 
          href={fileUrl} 
          download={fileName}
          className="ml-2 p-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>
    );
  }

  return <p className={cn("whitespace-pre-wrap break-words", className)}>{content}</p>;
};
