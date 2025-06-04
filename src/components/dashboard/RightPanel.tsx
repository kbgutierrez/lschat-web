'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ContactDetails } from '@/app/dashboard/page';
import { Group } from '@/lib/groupsApi';
import { messagesAPI, contactsAPI, ContactListItem } from '@/lib/api';
import { groupsAPI, GroupMember } from '@/lib/groupsApi';
import { getInitials } from './ContactItem';
import { gsap } from 'gsap';

type TabType = 'info' | 'media' | 'files';

interface RightPanelProps {
  contactDetails: ContactDetails | null;
  groupDetails: Group | null;
  groupMembers?: GroupMember[] | null;
  isVisible: boolean;
  onClose: () => void;
  pendingContacts?: ContactListItem[];
  activeTab?: 'chats' | 'groups' | 'contacts';
  onContactSelect?: (id: string) => void;
  loadingContacts?: boolean;
  onCancelContactRequest?: (contactId: number) => Promise<void>;
  refreshPendingContacts?: () => void;
  onInviteToGroup?: (groupId: number) => void; 
  isNewGroup?: boolean; 
}

interface MediaItem {
  id: string;
  url: string;
  type: string;
  fileName: string;
  timestamp: string;
}

interface FileItem {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  timestamp: string;
}

interface ContactData {
  user_id: number;
  contact_id: number;
  contact_full_name: string;
  contact_mobile_number: string;
  email?: string;
  pubnub_channel: string;
  status: string;
}

export function RightPanel({
  contactDetails,
  groupDetails,
  isVisible,
  onClose,
  pendingContacts = [],
  activeTab,
  onContactSelect,
  loadingContacts = false,
  onCancelContactRequest,
  refreshPendingContacts,
  onInviteToGroup, // Add this prop
  isNewGroup = false, // Add default value
}: RightPanelProps) {
  const [activeRightTab, setActiveRightTab] = useState<TabType>('info');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [isHoveringTab, setIsHoveringTab] = useState<TabType | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [groupMembersList, setGroupMembersList] = useState<GroupMember[]>([]);

  // Add refs for animation
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const inviteButtonRef = useRef<HTMLButtonElement>(null); // Add ref for invite button

  const name = contactDetails?.name || groupDetails?.name || 'No Selection';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const hasContent = contactDetails !== null || groupDetails !== null;
  const showPendingContacts = activeTab === 'contacts' && !hasContent && pendingContacts.length > 0;

  const [pubnubChannel, setPubnubChannel] = useState<string | null>(null);

  useEffect(() => {
    const fetchPubnubChannel = async () => {
      if (contactDetails?.id) {
        try {
          const userSession = localStorage.getItem('userSession');
          if (userSession) {
            const { user_id } = JSON.parse(userSession).user;
            const contacts = await contactsAPI.getContactList(user_id);
            const contact = contacts.find(c => c.contact_id.toString() === contactDetails.id);

            if (contact) {
              console.log('Found contact pubnub channel:', contact.pubnub_channel);
              setPubnubChannel(contact.pubnub_channel);
              setContactData({
                ...contact,
                email: contact.email || '',
              });
            } else {
              console.error('Contact not found in contact list');
              setPubnubChannel(null);
              setContactData(null);
            }
          }
        } catch (error) {
          console.error('Error fetching contacts for pubnub channel:', error);
          setPubnubChannel(null);
          setContactData(null);
        }
      } else if (groupDetails?.pubnub_channel) {
        setPubnubChannel(groupDetails.pubnub_channel);
        setContactData(null);
      } else {
        setPubnubChannel(null);
        setContactData(null);
      }
    };

    fetchPubnubChannel();
    handleGroupMembers();
  }, [contactDetails?.id, groupDetails?.pubnub_channel]);

  const fetchMedia = useCallback(async () => {
    if (!pubnubChannel) {
      console.log('Cannot fetch media: No pubnub channel available');
      return;
    }

    try {
      console.log('Fetching media from pubnub channel:', pubnubChannel);
      setLoadingMedia(true);
      setMediaError(null);

      let mediaItems: MediaItem[] = [];

      if (contactDetails) {
        try {
          const messages = await messagesAPI.getChatMessages(pubnubChannel);
          console.log('Fetched messages for media:', messages.length);

          const IMAGE_REGEX = /\[(?:Image|JPG|JPEG|PNG|GIF)(?:\s*File)?:?\s*(?:[^-\]]+)?(?:-\s*)?([^\]\s]+)\]/i;
          const FILE_IMAGE_REGEX = /\[(JPG|PNG|GIF|JPEG)\s*File:\s*([^-\]]+)\s*-\s*([^\]\s]+)\]/i;

          mediaItems = messages
            .filter(msg => {
              console.log('Checking message:', msg.message_content?.substring(0, 50));

              return msg.message_content?.includes('[Image:') ||
                msg.message_content?.includes('JPG File:') ||
                msg.message_content?.includes('PNG File:') ||
                msg.message_content?.includes('.jpg') ||
                msg.message_content?.includes('.png') ||
                msg.message_content?.includes('.gif') ||
                IMAGE_REGEX.test(msg.message_content || '') ||
                msg.message_type === 'file' ||
                msg.message_type === 'image';
            })
            .map((msg, index) => {
              const imgMatch = msg.message_content?.match(/\[Image:\s*(https?:\/\/[^\]\s]+)\]/i);
              const imgFileMatch = msg.message_content?.match(/\[(JPG|PNG|GIF|JPEG)\s*File:\s*([^-\]]+)\s*-\s*([^\]\s]+)\]/i);
              const plainUrlMatch = msg.message_content?.match(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif)/i);

              const flexMatch = msg.message_content?.match(IMAGE_REGEX);

              const url = imgMatch ? imgMatch[1] :
                imgFileMatch ? imgFileMatch[3] :
                  flexMatch ? flexMatch[1] :
                    plainUrlMatch ? plainUrlMatch[0] :
                      'https://via.placeholder.com/300/200?text=Image+Not+Found';

              let fileName = imgFileMatch ? imgFileMatch[2] : `Image ${index + 1}`;

              if (msg.message_type === 'file' || msg.message_type === 'image') {
                const urlParts = url.split('/');
                fileName = urlParts[urlParts.length - 1] || fileName;
              }

              console.log('Found media item:', { url, fileName });

              return {
                id: msg.message_id.toString(),
                url,
                type: 'image',
                fileName,
                timestamp: new Date(msg.created_at).toLocaleDateString()
              };
            });
        } catch (error) {
          console.error('Error fetching contact messages:', error);
        }
      }
      else if (groupDetails) {
        try {
          const messages = await groupsAPI.getGroupMessages(groupDetails.group_id);
          console.log('Fetched group messages for media:', messages.length);

          const IMAGE_REGEX = /\[(?:Image|JPG|JPEG|PNG|GIF)(?:\s*File)?:?\s*(?:[^-\]]+)?(?:-\s*)?([^\]\s]+)\]/i;
          const FILE_IMAGE_REGEX = /\[(JPG|PNG|GIF|JPEG)\s*File:\s*([^-\]]+)\s*-\s*([^\]\s]+)\]/i;

          mediaItems = messages
            .filter(msg => {
              // console.log('Checking group message:', msg.message?.substring(0, 50));

              return msg.message?.includes('[Image:') ||
                msg.message?.includes('JPG File:') ||
                msg.message?.includes('PNG File:') ||
                msg.message?.includes('.jpg') ||
                msg.message?.includes('.png') ||
                msg.message?.includes('.gif') ||
                IMAGE_REGEX.test(msg.message || '');
            })
            .map((msg, index) => {
              const imgMatch = msg.message?.match(/\[Image:\s*(https?:\/\/[^\]\s]+)\]/i);
              const imgFileMatch = msg.message?.match(/\[(JPG|PNG|GIF|JPEG)\s*File:\s*([^-\]]+)\s*-\s*([^\]\s]+)\]/i);
              const plainUrlMatch = msg.message?.match(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif)/i);

              const flexMatch = msg.message?.match(IMAGE_REGEX);

              const url = imgMatch ? imgMatch[1] :
                imgFileMatch ? imgFileMatch[3] :
                  flexMatch ? flexMatch[1] :
                    plainUrlMatch ? plainUrlMatch[0] :
                      'https://via.placeholder.com/300/200?text=Image+Not+Found';

              const fileName = imgFileMatch ? imgFileMatch[2] : `Image ${index + 1}`;
              return {
                id: msg.id.toString(),
                url,
                type: 'image',
                fileName,
                timestamp: new Date(msg.created_at).toLocaleDateString()
              };
            });
        } catch (error) {
          console.error('Error fetching group messages:', error);
        }
      }

      console.log('Total media items found:', mediaItems.length);
      setMedia(mediaItems);
    } catch (error) {
      console.error('Error fetching media:', error);
      setMediaError('Failed to load media attachments');
    } finally {
      setLoadingMedia(false);
    }
  }, [pubnubChannel, contactDetails, groupDetails]);

  const fetchFiles = useCallback(async () => {
    if (!pubnubChannel) {
      console.log('Cannot fetch files: No pubnub channel available');
      return;
    }

    try {
      console.log('Fetching files from pubnub channel:', pubnubChannel);
      setLoadingFiles(true);
      setFilesError(null);

      let fileItems: FileItem[] = [];

      if (contactDetails) {
        try {
          const messages = await messagesAPI.getChatMessages(pubnubChannel);
          console.log('Fetched messages for files:', messages.length);

          const FILE_REGEX = /\[File:\s*(https?:\/\/[^\|\]\s]+)(?:\|([^\]\s]+))?\]/i;

          fileItems = messages
            .filter(msg => {
              const fileMatch = msg.message_content?.match(FILE_REGEX);
              const hasValidFileUrl = fileMatch && fileMatch[1] && fileMatch[1].startsWith('http');

              return hasValidFileUrl &&
                !msg.message_content?.includes('[Image:') &&
                !msg.message_content?.includes('JPG File:') &&
                !msg.message_content?.includes('PNG File:');
            })
            .map((msg, index) => {
              const fileMatch = msg.message_content?.match(/\[File:\s*(https?:\/\/[^\|\]\s]+)\|([^\]\s]+)\]/i);

              if (!fileMatch || !fileMatch[1]) return null;

              const url = fileMatch[1];
              let fileName = fileMatch[2] || '';

              if (!fileName) {
                const urlParts = url.split('/');
                fileName = urlParts[urlParts.length - 1] || `File ${index + 1}`;
              }

              const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';

              return {
                id: msg.message_id.toString(),
                url,
                fileName,
                fileType: fileExt,
                fileSize: `${((msg.message_content?.length || 0) % 10 + 1) / 2} MB`,
                timestamp: new Date(msg.created_at).toLocaleDateString()
              };
            })
            .filter(Boolean) as FileItem[];
        } catch (error) {
          console.error('Error fetching contact messages for files:', error);
        }
      }
      else if (groupDetails) {
        try {
          const messages = await groupsAPI.getGroupMessages(groupDetails.group_id);
          console.log('Fetched group messages for files:', messages.length);

          const FILE_REGEX = /\[File:\s*(https?:\/\/[^\|\]\s]+)(?:\|([^\]\s]+))?\]/i;

          fileItems = messages
            .filter(msg => {
              const fileMatch = msg.message?.match(FILE_REGEX);
              const hasValidFileUrl = fileMatch && fileMatch[1] && fileMatch[1].startsWith('http');

              return hasValidFileUrl &&
                !msg.message?.includes('[Image:') &&
                !msg.message?.includes('JPG File:') &&
                !msg.message?.includes('PNG File:');
            })
            .map((msg, index) => {
              const fileMatch = msg.message.match(/\[File:\s*(https?:\/\/[^\|\]\s]+)\|([^\]\s]+)\]/i);

              if (!fileMatch || !fileMatch[1]) return null;

              const url = fileMatch[1];
              let fileName = fileMatch[2] || '';

              if (!fileName) {
                const urlParts = url.split('/');
                fileName = urlParts[urlParts.length - 1] || `File ${index + 1}`;
              }

              const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';

              return {
                id: msg.id.toString(),
                url,
                fileName,
                fileType: fileExt,
                fileSize: `${((msg.message.length % 10) + 1) / 2} MB`,
                timestamp: new Date(msg.created_at).toLocaleDateString()
              };
            })
            .filter(Boolean) as FileItem[];
        } catch (error) {
          console.error('Error fetching group messages for files:', error);
        }
      }

      console.log('Total file items found:', fileItems.length);
      setFiles(fileItems);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFilesError('Failed to load file attachments');
    } finally {
      setLoadingFiles(false);
    }
  }, [pubnubChannel, contactDetails, groupDetails]);





  useEffect(() => {
    if (activeRightTab === 'media') {
      fetchMedia();
    } else if (activeRightTab === 'files') {
      fetchFiles();
    }
  }, [activeRightTab, contactDetails, groupDetails, fetchMedia, fetchFiles]);

  const [cancellingRequests, setCancellingRequests] = useState<Set<number>>(new Set());
  
  const [openMenus, setOpenMenus] = useState<Set<number>>(new Set());
  const [confirmingCancel, setConfirmingCancel] = useState<number | null>(null);

  const handleCancelRequest = async (contactId: number) => {
    if (!onCancelContactRequest) return;

    setCancellingRequests(prev => new Set(prev).add(contactId));
    setConfirmingCancel(null);
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      newSet.delete(contactId);
      return newSet;
    });

    try {
      await onCancelContactRequest(contactId);
    } catch (error) {
      console.error('Failed to cancel request:', error);
    } finally {
      setCancellingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(contactId);
        return newSet;
      });
    }
  };

  const showCancelConfirmation = (contactId: number) => {
    setConfirmingCancel(contactId);
    setOpenMenus(new Set());
  };

  const cancelCancelRequest = () => {
    setConfirmingCancel(null);
  };

  const toggleMenu = (contactId: number) => {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };


  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenus(new Set());
    };

    if (openMenus.size > 0) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenus.size]);

  const [localPendingContacts, setLocalPendingContacts] = useState(pendingContacts);
  const backgroundRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(Date.now());

  // Update local state when pendingContacts prop changes
  useEffect(() => {
    setLocalPendingContacts(pendingContacts);
  }, [pendingContacts]);
  useEffect(() => {
    const setupBackgroundRefresh = () => {
      if (backgroundRefreshTimerRef.current) {
        clearInterval(backgroundRefreshTimerRef.current);
      }


      if (refreshPendingContacts && isVisible && activeTab === 'contacts' && !hasContent) {
        backgroundRefreshTimerRef.current = setInterval(() => {
          if (Date.now() - lastRefreshTimeRef.current > 2500) {
            refreshPendingContacts();
            lastRefreshTimeRef.current = Date.now();
          }
        }, 5000);
      }
    };

    setupBackgroundRefresh();

    return () => {
      if (backgroundRefreshTimerRef.current) {
        clearInterval(backgroundRefreshTimerRef.current);
        backgroundRefreshTimerRef.current = null;
      }
    };
  }, [refreshPendingContacts, isVisible, activeTab, hasContent]);
  useEffect(() => {
    if (isVisible && !hasContent && activeTab === 'contacts' && refreshPendingContacts) {
      refreshPendingContacts();
      lastRefreshTimeRef.current = Date.now();
    }
  }, [isVisible, hasContent, activeTab, refreshPendingContacts]);

  const handleTabClick = (tab: TabType) => {
    if (tab === activeRightTab) return;

    const tabsElement = tabsRef.current;
    const indicatorElement = tabIndicatorRef.current;

    if (!tabsElement || !indicatorElement) {
      setActiveRightTab(tab);
      return;
    }

    const currentTabElement = tabsElement.querySelector(`[data-tab="${activeRightTab}"]`);
    const targetTabElement = tabsElement.querySelector(`[data-tab="${tab}"]`);

    if (!currentTabElement || !targetTabElement) {
      setActiveRightTab(tab);
      return;
    }

    const tabsRect = tabsElement.getBoundingClientRect();
    const currentRect = currentTabElement.getBoundingClientRect();
    const targetRect = targetTabElement.getBoundingClientRect();

    const currentLeft = currentRect.left - tabsRect.left;
    const currentWidth = currentRect.width;

    const targetLeft = targetRect.left - tabsRect.left;
    const targetWidth = targetRect.width;

    const tl = gsap.timeline({
      onComplete: () => setActiveRightTab(tab),
      defaults: { duration: 0.2, ease: "power2.inOut" }
    });

    if (targetLeft > currentLeft) {
      tl.to(indicatorElement, {
        width: targetLeft + targetWidth - currentLeft,
      }).to(indicatorElement, {
        left: targetLeft,
        width: targetWidth
      }, ">=0");
    } else {
      tl.to(indicatorElement, {
        left: targetLeft,
        width: currentLeft + currentWidth - targetLeft
      }).to(indicatorElement, {
        width: targetWidth
      }, ">=0");
    }

    if (tabContentRef.current) {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0.92, y: 3 },
        { opacity: 1, y: 0, duration: 0.2, delay: 0.1 }
      );
    }
  };

  const handleTabHover = (tab: TabType) => {
    setIsHoveringTab(tab);
  };

  const handleTabLeave = () => {
    setIsHoveringTab(null);
  };

  const handleMembersClick = () => {
    setShowMembers(prev => !prev);
    console.log('Members button clicked, showMembers:', !showMembers);
    if (!showMembers) {
      handleGroupMembers();
    }
  }
  const handleGroupMembers = async () => {
    if (!groupDetails) return;
    try {
      const members = await groupsAPI.getGroupMembers(groupDetails.group_id);
      console.log('Fetched group members:', members);
      setGroupMembersList(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  }


  useEffect(() => {
    if (!tabIndicatorRef.current || !tabsRef.current) return;

    const tabs = tabsRef.current.querySelectorAll('[data-tab]');
    const activeTabElement = tabsRef.current.querySelector(`[data-tab="${activeRightTab}"]`);

    if (activeTabElement) {
      const tabRect = activeTabElement.getBoundingClientRect();
      const tabsRect = tabsRef.current.getBoundingClientRect();

      const currentLeft = parseFloat(tabIndicatorRef.current.style.left) || 0;
      const currentWidth = parseFloat(tabIndicatorRef.current.style.width) || 0;

      const targetLeft = tabRect.left - tabsRect.left;
      const targetWidth = tabRect.width;

      const tl = gsap.timeline({
        defaults: {
          ease: 'power2.out',
          duration: 0.2
        }
      });

      gsap.set(tabIndicatorRef.current, {
        top: 'auto',
        bottom: 0,
        right: 'auto',
        height: '2px',
        width: currentWidth,
        left: currentLeft
      });

      if (currentLeft > 0 && Math.abs(targetLeft - currentLeft) > 5) {
        tl.to(tabIndicatorRef.current, {
          width: Math.max(targetLeft + targetWidth - currentLeft, currentWidth),
          duration: 0.15
        });

        tl.to(tabIndicatorRef.current, {
          left: targetLeft,
          duration: 0.15
        }, "-=0.05");

        tl.to(tabIndicatorRef.current, {
          width: targetWidth,
          duration: 0.15
        }, "-=0.05");
      } else {
        tl.to(tabIndicatorRef.current, {
          left: targetLeft,
          width: targetWidth,
        });
      }

      if (tabContentRef.current) {
        gsap.fromTo(
          tabContentRef.current,
          { opacity: 0.9, y: 5 },
          { opacity: 1, y: 0, duration: 0.2 }
        );
      }
    }
  }, [activeRightTab]);

  // Add effect to animate the invite button when a new group is created
  useEffect(() => {
    if (isNewGroup && inviteButtonRef.current && groupDetails) {
      // Create a subtle highlight animation for the invite button
      const timeline = gsap.timeline();
      
      timeline.to(inviteButtonRef.current, {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.25)',
        duration: 0.5,
        repeat: 3,
        yoyo: true
      });
      
      return () => {
        timeline.kill();
      };
    }
  }, [isNewGroup, groupDetails]);

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col",
        "fixed md:relative inset-y-0 right-0 z-30 md:z-0",
        "w-80",
        isVisible ? "translate-x-0" : "translate-x-full md:translate-x-0",
        "transition-all duration-300 ease-in-out"
      )}
    >
      {hasContent ? (
        <>
          <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center">
            {contactDetails?.contactPicture ? (
              <Image
                src={contactDetails.contactPicture}
                alt={name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full mb-2 object-cover"
              />
            ) : (
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold mb-4",
                contactDetails
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300"
                  : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
              )}>
                {initials}
              </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 ">{name}</h3>
            {contactDetails && (
              <div className="flex items-center">
                <span className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  contactDetails.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                )}></span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {contactDetails.status === 'online'
                    ? 'Online now'
                    : `Offline`}
                </p>
              </div>
            )}

            {groupDetails && groupDetails.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                {groupDetails.description}
              </p>
            )}
          </div>


          <div className="relative">
            <div ref={tabsRef} className="flex relative">
              {(['info', 'media', 'files'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  data-tab={tab}
                  className={cn(
                    "flex-1 py-2.5 px-1 text-sm font-medium transition-colors relative z-10 cursor-pointer",
                    "border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none",
                    "shadow-none !ring-0 !ring-offset-0",
                    activeRightTab === tab
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300",
                    isHoveringTab === tab && activeRightTab !== tab && "text-gray-800 dark:text-gray-300"
                  )}
                  style={{
                    boxShadow: 'none',
                    outline: 'none'
                  }}
                  onClick={() => handleTabClick(tab)}
                  onMouseEnter={() => handleTabHover(tab)}
                  onMouseLeave={handleTabLeave}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}

              <div
                ref={tabIndicatorRef}
                className="absolute bottom-0 h-[2px] bg-violet-500 dark:bg-violet-400 rounded-full transition-none"
                style={{ width: '33.33%', left: '0%' }}
              />
            </div>
            {/* This line acts as a bottom separator under all tabs */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-200 dark:bg-gray-800"></div>
          </div>

          <div ref={tabContentRef} className="flex-1 overflow-auto no-scrollbar">
            {activeRightTab === 'info' && (
              <div className="p-4 space-y-4">
                {contactDetails && (
                  <>
                    <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4">
                      <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-3">Contact Information</h4>

                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {contactData?.contact_mobile_number || 'No phone number'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                              {contactData?.email || 'No email available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {groupDetails && (
                  <>
                    {showMembers ? (
                      <div className="rounded-md bg-gray-50 dark:bg-gray-800 ">
                        <button
                          onClick={handleMembersClick}
                          className="cursor-pointer mb-4 flex items-center text-sm font-medium text-violet-600
                          dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 focus:outline-none"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Back to info
                        </button>

                        <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                          <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium">Group Members</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 ">
                            {groupMembersList.length} participants
                          </p>
                        </div>

                        <div className="space-y-3">
                          {groupMembersList.map((member) => (
                            <div key={member.user_id} className="flex items-center py-2">
                              <div className="flex-shrink-0 mr-3">
                                {member.profile_picture ? (
                                  <Image
                                    src={member.profile_picture}
                                    alt={member.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                    <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                  {member.name}
                                </p>
                                {member.role === 'admin' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4">
                          <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-3">Group Information</h4>

                          <div className="space-y-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <button onClick={handleMembersClick} className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 
                    outline-0 focus:outline-0 focus:ring-0 focus-visible:outline-0">
                                    Members
                                  </button>
                                  
                                  {/* Keep the inline Invite Members button */}
                                  {groupDetails.role === 'admin' && (
                                    <button
                                      ref={inviteButtonRef}
                                      onClick={() => onInviteToGroup && groupDetails && onInviteToGroup(groupDetails.group_id)}
                                      className="ml-2 p-1.5 rounded-full text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                                      title="Invite Members"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{groupMembersList.length} participants</p>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(groupDetails.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {groupDetails.description && (
                          <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4">
                            <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-2">Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{groupDetails.description}</p>
                          </div>
                        )}
                        
                      </>
                    )}

                  </>
                )}
              </div>
            )}

            {activeRightTab === 'media' && (
              <div className="p-4">
                <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-3">Shared Media</h4>

                {loadingMedia ? (
                  <div className="py-8 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
                  </div>
                ) : mediaError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{mediaError}</p>
                    <button
                      onClick={fetchMedia}
                      className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : media.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No media shared</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {media.map((item) => (
                      <div key={item.id} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden group relative">
                        <Image
                          src={item.url}
                          alt={item.fileName}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/30 rounded-full backdrop-blur-sm"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {media.length > 0 && (
                  <button
                    className="mt-4 w-full py-2 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                    onClick={() => { }}
                  >
                    View All Media
                  </button>
                )}
              </div>
            )}
            {activeRightTab === 'files' && (
              <div className="p-4">
                <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-3">Shared Files</h4>
                {loadingFiles ? (
                  <div className="py-8 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
                  </div>
                ) : filesError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{filesError}</p>
                    <button
                      onClick={fetchFiles}
                      className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No files shared</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((item) => {
                      const getFileIcon = () => {
                        switch (item.fileType.toLowerCase()) {
                          case 'pdf': return '📕';
                          case 'doc':
                          case 'docx': return '📘';
                          case 'xlsx':
                          case 'xls': return '📊';
                          case 'zip':
                          case 'rar': return '📦';
                          case 'txt': return '📝';
                          default: return '📄';
                        }
                      };

                      return (
                        <div key={item.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md group">
                          <div className="text-xl mr-3 w-8 text-center">
                            {getFileIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.fileName}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>{item.fileSize}</span>
                              <span className="mx-1.5 w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                              <span>{item.timestamp}</span>
                            </div>
                          </div>
                          <a
                            href={item.url}
                            download={item.fileName}
                            className="p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 opacity-70 group-hover:opacity-100"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}

                {files.length > 0 && (
                  <button className="mt-4 w-full py-2 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300">
                    View All Files
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : showPendingContacts ? (
        <div className="flex-1 overflow-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contact Requests</h3>
          </div>

          {loadingContacts ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {pendingContacts.map(contact => {
                const isMenuOpen = openMenus.has(contact.contact_id);
                const isCancelling = cancellingRequests.has(contact.contact_id);
                const isConfirming = confirmingCancel === contact.contact_id;

                return (
                  <div
                    key={contact.contact_id}
                    className="relative p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-700 dark:text-violet-300 text-base font-bold">
                        {getInitials(contact.contact_full_name)}
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{contact.contact_full_name}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          {isCancelling ? 'Cancelling...' : 'Pending'}
                        </span>

                        {onCancelContactRequest && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(contact.contact_id);
                              }}
                              disabled={isCancelling}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>

                            {isMenuOpen && (
                              <div
                                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 py-1 z-10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => showCancelConfirmation(contact.contact_id)}
                                  disabled={isCancelling}
                                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Cancel Request
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirmation overlay */}
                    {isConfirming && (
                      <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center">
                        <div className="text-center px-2">
                          <div className="text-sm font-medium mb-3 text-red-800 dark:text-red-200">
                            Cancel contact request for <span className="font-medium">{contact.contact_full_name}</span>?
                          </div>
                          <div className="flex justify-center gap-2">
                            <button
                              className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                              onClick={cancelCancelRequest}
                            >
                              No
                            </button>
                            <button
                              className="px-3 py-1.5 text-xs rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                              onClick={() => handleCancelRequest(contact.contact_id)}
                            >
                              Yes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-600 mb-3">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Selection</h3>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Select a contact or group to view details
          </p>
        </div>
      )}

      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
        aria-label="Close details"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
