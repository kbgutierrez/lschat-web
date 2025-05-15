'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState<{ url: string; alt: string }>({ url: '', alt: '' });
  const [scale, setScale] = useState(0.2); 
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (url: string, alt: string) => {
    setModalImage({ url, alt });
    setScale(0.2); 
    setPosition({ x: 0, y: 0 });
    setShowImageModal(true);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.1));
  };

  const handleResetZoom = () => {
    setScale(0.2);
    setPosition({ x: 0, y: 0 });
  };

  const handleFullScreen = () => {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 0.2) { 
      setDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && scale > 0.2) { 
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showImageModal) return;
      
      switch (e.key) {
        case 'Escape':
          setShowImageModal(false);
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
        case 'f':
          handleFullScreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageModal]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !showImageModal) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setScale(prev => Math.min(prev + 0.1, 5));
      } else {
        setScale(prev => Math.max(prev - 0.1, 0.1));
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [showImageModal]);

  let contentRender;

  const imageFileMatch = content.match(IMAGE_FILE_PATTERN);
  if (imageFileMatch && imageFileMatch[3]) {
    const imageType = imageFileMatch[1].toLowerCase();
    const fileName = imageFileMatch[2].trim();
    const imageUrl = imageFileMatch[3];

    contentRender = (
      <div className={cn('relative', className)}>
        {!imageLoaded && !imageError && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4 min-h-[200px] animate-pulse">
            <svg
              className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">Loading {fileName}...</p>
          </div>
        )}

        {imageError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <svg
              className="w-6 h-6 text-red-500 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z"
              />
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
              'overflow-hidden rounded-lg transition-opacity cursor-pointer',
              !imageLoaded && 'opacity-0',
              imageLoaded && 'opacity-100'
            )}
          >
            
            <div className="relative" onClick={() => imageLoaded && handleImageClick(imageUrl, fileName)}>
              <Image
                src={imageUrl}
                alt={fileName}
                width={500}
                height={300}
                className="max-w-full rounded-lg object-contain hover:opacity-95"
                style={{ maxHeight: '300px', width: 'auto' }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                unoptimized
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">Click to view</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    const imageMatch = content.match(IMAGE_PATTERN);
    if (imageMatch && imageMatch[1]) {
      const imageUrl = imageMatch[1];
      contentRender = (
        <div className={cn('relative', className)}>
          {!imageLoaded && !imageError && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center p-4 min-h-[200px] animate-pulse">
              <svg
                className="w-8 h-8 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {imageError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
              <svg
                className="w-6 h-6 text-red-500 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z"
                />
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
                'overflow-hidden rounded-lg transition-opacity cursor-pointer',
                !imageLoaded && 'opacity-0',
                imageLoaded && 'opacity-100'
              )}
              onClick={() => imageLoaded && handleImageClick(imageUrl, 'Message attachment')}
            >
              <Image
                src={imageUrl}
                alt="Message attachment"
                width={500}
                height={300}
                className="max-w-full rounded-lg object-contain hover:opacity-95"
                style={{ maxHeight: '300px', width: 'auto' }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                unoptimized
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">Click to view</div>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      const fileMatch = content.match(FILE_PATTERN);
      if (fileMatch && fileMatch[1] && fileMatch[2]) {
        const fileUrl = fileMatch[1];
        const fileName = fileMatch[2];
        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

        const getFileIcon = () => {
          switch (fileExt) {
            case 'pdf':
              return (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              );
            case 'doc':
            case 'docx':
              return (
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              );
            case 'xls':
            case 'xlsx':
              return (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              );
            default:
              return (
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              );
          }
        };

        contentRender = (
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="mr-3">{getFileIcon()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-300 truncate">{fileName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{fileExt.toUpperCase()} File</p>
            </div>
            <a
              href={fileUrl}
              download={fileName}
              className="ml-2 p-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>
          </div>
        );
      } else {
        // Default case: regular text
        contentRender = <p className={cn('whitespace-pre-wrap break-words', className)}>{content}</p>;
      }
    }
  }

  // Return the content and modal in a fragment
  return (
    <>
      {contentRender}

      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setShowImageModal(false)}
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: scale > 0.2 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              ref={imageRef}
              src={modalImage.url}
              alt={modalImage.alt}
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
                onClick={handleZoomOut}
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
                onClick={handleZoomIn}
                title="Zoom In (+ key)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              <button
                className="p-2 text-white hover:bg-white/20 rounded-full"
                onClick={handleResetZoom}
                title="Reset View (0 key)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </button>
              
              <button
                className="p-2 text-white hover:bg-white/20 rounded-full"
                onClick={handleFullScreen}
                title="Full Screen (f key)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </button>
            </div>
            
            <button
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              onClick={() => setShowImageModal(false)}
              title="Close (Esc key)"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {modalImage.alt && (
              <div className="absolute top-4 left-4 max-w-[50%] bg-black/50 text-white text-sm px-3 py-1 rounded-md backdrop-blur-sm truncate">
                {modalImage.alt}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
