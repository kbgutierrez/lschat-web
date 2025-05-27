'use client';

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ContactListItem } from '@/lib/api';
import { ContactItem } from './ContactItem';
import { GroupItem, GroupData } from './GroupItem';
import { gsap } from 'gsap';
import { Message } from './MessageItem';

type TabType = 'chats' | 'groups' | 'contacts';

interface SidebarProps {
  contacts: ContactListItem[];
  groups: GroupData[];
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedContact: string | null;
  selectedGroup: number | null;
  handleContactSelect: (id: string) => void;
  handleGroupSelect: (id: number) => void;
  loadingContacts: boolean;
  apiError: string | null;
  loadingGroups: boolean;
  groupError: string | null;
  clearSelection?: () => void;
  onNewChat?: () => void;
  onNewGroup?: () => void;
  onNewContact?: () => void;
  messages?: Record<string, Message[]>;
}

export function Sidebar({ 
  contacts, 
  groups,
  isOpen, 
  onClose,
  activeTab,
  setActiveTab,
  selectedContact,
  selectedGroup,
  handleContactSelect,
  handleGroupSelect,
  loadingContacts,
  apiError,
  loadingGroups,
  groupError,
  clearSelection,
  onNewChat,
  onNewGroup,
  onNewContact,
  messages = {}
}: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const floatingButtonRef = useRef<HTMLButtonElement>(null);
  const buttonLabelRef = useRef<HTMLSpanElement>(null);

  const [isHoveringTab, setIsHoveringTab] = useState<TabType | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  const getLastMessage = (channelId: string) => {
    if (!messages[channelId]?.length) return "";
    const lastMsg = messages[channelId][messages[channelId].length - 1];
    return lastMsg.text.length > 30 
      ? lastMsg.text.substring(0, 30) + '...' 
      : lastMsg.text;
  };

  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { 
          x: '-100%',
          opacity: 0.5, 
        },
        { 
          x: '0%',
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!tabIndicatorRef.current || !tabsRef.current) return;
    
    const tabs = tabsRef.current.querySelectorAll('[data-tab]');
    const activeTabElement = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
    
    if (activeTabElement) {
      const tabRect = activeTabElement.getBoundingClientRect();
      const tabsRect = tabsRef.current.getBoundingClientRect();
      
      gsap.to(tabIndicatorRef.current, {
        left: tabRect.left - tabsRect.left,
        width: tabRect.width,
        duration: 0.3,
        ease: 'power2.out',
      });
      
      if (tabContentRef.current) {
        gsap.fromTo(
          tabContentRef.current,
          { opacity: 0.8, y: 10 },
          { opacity: 1, y: 0, duration: 0.3 }
        );
      }
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (!floatingButtonRef.current) return;
    
    gsap.set(floatingButtonRef.current, { 
      opacity: 1, 
      scale: 1,
      width: '2.5rem',
      height: '2.5rem'
    });
    
    const tl = gsap.timeline({ repeat: 0 });
    
    tl.fromTo(
      floatingButtonRef.current, 
      { scale: 0.9, opacity: 0.9 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
    );
    
    return () => {
      tl.kill();
    };
  }, [activeTab]);
  
  const handleTabHover = (tab: TabType) => {
    setIsHoveringTab(tab);
  };
  
  const handleTabLeave = () => {
    setIsHoveringTab(null);
  };

  const getFloatingButtonAction = () => {
    switch (activeTab) {
      case 'chats':
        return { 
          action: onNewChat, 
          label: 'New message',
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          )
        };
      case 'groups':
        return { 
          action: onNewGroup, 
          label: 'Create group',
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v8m4-4H8" transform="translate(8 6) scale(0.5)" />
            </svg>
          )
        };
      case 'contacts':
        return { 
          action: onNewContact, 
          label: 'Add new contact',
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          )
        };
      default:
        return { 
          action: undefined, 
          label: 'New',
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          )
        };
    }
  };
  
  const { action: floatingButtonAction, label: floatingButtonLabel, icon: floatingButtonIcon } = getFloatingButtonAction();

  useEffect(() => {
    if (!floatingButtonRef.current || !buttonLabelRef.current) return;
    
    if (isButtonHovered) {
      gsap.to(floatingButtonRef.current, {
        width: 'auto',
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(buttonLabelRef.current, {
        opacity: 1,
        visibility: 'visible',
        duration: 0.2,
        delay: 0.1,
      });
    } else {
      gsap.to(buttonLabelRef.current, {
        opacity: 0,
        duration: 0.15,
        onComplete: () => {
          gsap.set(buttonLabelRef.current, { visibility: 'hidden' });
        }
      });
      
      gsap.to(floatingButtonRef.current, {
        width: '2.5rem',
        duration: 0.25,
        delay: 0.05,
        ease: 'power2.in'
      });
    }
  }, [isButtonHovered]);

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        "w-80 bg-gradient-to-b from-violet-700 to-violet-900 dark:from-gray-900 dark:to-gray-950",
        "flex flex-col h-full fixed md:relative left-0 top-0 z-30 md:z-10",
        "transform transition-transform duration-300 ease-in-out gpu-accelerated",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "shadow-lg md:shadow-none"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-violet-600/30 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src="/images/logo-no-label.png"
              alt="LSChat Logo"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <h1 className="text-lg font-bold text-yellow-300 dark:text-yellow-300">
            LS<span className="text-white dark:text-white">Chat</span> <span className='text-purple-300 dark:text-purple-400'> Web</span>
          </h1>
        </div>
        
        <button 
          onClick={onClose}
          className="md:hidden p-2 rounded-full text-white/80 hover:text-white hover:bg-violet-800/50 dark:hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="px-2 pt-3 pb-2 relative">
        <div 
          ref={tabsRef}
          className="flex items-center justify-around relative"
        >
          {(['chats', 'groups', 'contacts'] as TabType[]).map((tab) => (
            <button
              key={tab}
              data-tab={tab}
              className={cn(
                "flex-1 py-2 px-1 text-center text-sm font-medium relative z-10 transition-colors",
                "outline-none focus:outline-none focus:ring-0 focus-visible:outline-none",
                "border-0 shadow-none !ring-0 !ring-offset-0",
                activeTab === tab 
                  ? "text-white" 
                  : "text-white/70 hover:text-white/90",
                isHoveringTab === tab && activeTab !== tab && "text-white/90"
              )}
              style={{ 
                boxShadow: 'none',
                outline: 'none'
              }}
              onClick={() => setActiveTab(tab)}
              onMouseEnter={() => handleTabHover(tab)}
              onMouseLeave={handleTabLeave}
            >
              <div className="flex flex-col items-center gap-1 outline-none border-none">
                {tab === 'chats' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === tab ? 2.2 : 1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                {tab === 'groups' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === tab ? 2.2 : 1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {tab === 'contacts' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === tab ? 2.2 : 1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            </button>
          ))}
          
          <div 
            ref={tabIndicatorRef}
            className="absolute bottom-0 h-0.5 bg-white rounded-full transition-all duration-300"
            style={{ width: '33.33%', left: '0%' }}
          />
        </div>
      </div>
      
      <div className="p-3">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-white/10 dark:bg-gray-800 text-white placeholder-white/60 dark:placeholder-gray-400 border-0 rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-white/25 focus:bg-white/15 dark:focus:bg-gray-700 transition-all duration-200"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div 
        ref={tabContentRef}
        className="flex-1 overflow-y-auto no-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 px-3 pb-28" 
      >
        {activeTab === 'chats' && (
          <div className="space-y-1 py-2">
            <h3 className="text-xs uppercase tracking-wider text-white/60 dark:text-gray-400 font-medium px-2 mb-2">
              Recent Conversations
            </h3>
            
            {contacts.length === 0 && !loadingContacts ? (
              <div className="bg-white/10 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-sm text-white/80 dark:text-gray-300">
                  No conversations yet. Start by adding contacts!
                </p>
              </div>
            ) : loadingContacts ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full animation-delay-200"></div>
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full animation-delay-500"></div>
                </div>
              </div>
            ) : apiError ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
                <p className="text-sm text-red-200">Error: {apiError}</p>
              </div>
            ) : (
              contacts
                .filter(c => c.status !== 'pending')
                .map(contact => {
                  const contactChannel = contact.pubnub_channel || '';
                  const lastMsg = getLastMessage(contactChannel);
                  
                  return (
                    <ContactItem
                      key={contact.contact_id}
                      contact={contact}
                      isSelected={selectedContact === contact.contact_id.toString()}
                      onSelect={handleContactSelect}
                      lastMessage={lastMsg}
                    />
                  );
                })
            )}
          </div>
        )}
        
        {activeTab === 'groups' && (
          <div className="space-y-1 py-2">
            <h3 className="text-xs uppercase tracking-wider text-white/60 dark:text-gray-400 font-medium px-2 mb-2">
              Your Groups
            </h3>
            
            {groups.length === 0 && !loadingGroups ? (
              <div className="bg-white/10 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-sm text-white/80 dark:text-gray-300">
                  No groups yet. Create a new group to get started!
                </p>
              </div>
            ) : loadingGroups ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full animation-delay-200"></div>
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full animation-delay-500"></div>
                </div>
              </div>
            ) : groupError ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
                <p className="text-sm text-red-200">Error: {groupError}</p>
              </div>
            ) : (
              groups.map(group => (
                <GroupItem
                  key={group.group_id}
                  group={group}
                  isSelected={selectedGroup === group.group_id}
                  onSelect={handleGroupSelect}
                />
              ))
            )}
          </div>
        )}
        
        {activeTab === 'contacts' && (
          <div className="space-y-1 py-2">
            <h3 className="text-xs uppercase tracking-wider text-white/60 dark:text-gray-400 font-medium px-2 mb-2">
              Your Contacts
            </h3>
            
            {contacts.length === 0 && !loadingContacts ? (
              <div className="bg-white/10 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-sm text-white/80 dark:text-gray-300">
                  No contacts yet. Add your first contact to start chatting!
                </p>
              </div>
            ) : loadingContacts ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full animation-delay-200"></div>
                  <div className="h-2 w-2 bg-white/70 dark:bg-gray-400 rounded-full animation-delay-500"></div>
                </div>
              </div>
            ) : apiError ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
                <p className="text-sm text-red-200">Error: {apiError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  {contacts
                    .filter(c => c.status !== 'pending')
                    .map(contact => (
                      <ContactItem
                        key={contact.contact_id}
                        contact={contact}
                        isSelected={selectedContact === contact.contact_id.toString()}
                        onSelect={handleContactSelect}
                      />
                    ))
                  }
                </div>

                {contacts.filter(c => c.status === 'pending').length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs uppercase tracking-wider text-white/60 dark:text-gray-400 font-medium px-2 mb-2">
                      Pending Requests
                    </h3>
                    
                    {contacts
                      .filter(c => c.status === 'pending')
                      .map(contact => (
                        <ContactItem
                          key={contact.contact_id}
                          contact={contact}
                          isSelected={selectedContact === contact.contact_id.toString()}
                          onSelect={handleContactSelect}
                        />
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {floatingButtonAction && (
        <div className="absolute bottom-5 right-5">
          <button
            ref={floatingButtonRef}
            onClick={floatingButtonAction}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            className="grid grid-flow-col auto-cols-min items-center h-10 bg-white/25 dark:bg-gray-700/60 hover:bg-white/30 dark:hover:bg-gray-700/80 text-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            style={{ 
              width: '2.5rem',
              opacity: 1
            }}
          >
            <div className="flex items-center justify-center w-10 h-10">
              <svg 
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {activeTab === 'chats' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                )}
                {activeTab === 'groups' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                )}
                {activeTab === 'contacts' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                )}
              </svg>
            </div>
            
            <span 
              ref={buttonLabelRef}
              className="pr-3 whitespace-nowrap font-medium text-sm"
              style={{ opacity: 0, visibility: 'hidden' }}
            >
              {floatingButtonLabel}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
