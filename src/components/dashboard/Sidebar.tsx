'use client';

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ContactListItem } from '@/lib/api';
import { ContactItem } from './ContactItem';
import { GroupItem, GroupData } from './GroupItem';
import { gsap } from 'gsap';

type TabType = 'chats' | 'groups' | 'contacts';

interface SidebarProps {
  contacts: ContactListItem[];
  groups: GroupData[];
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedContact: string | null;
  handleContactSelect: (id: string) => void;
  loadingContacts: boolean;
  apiError: string | null;
  loadingGroups: boolean;
  groupError: string | null;
  selectedGroup: number | null;
  handleGroupSelect: (id: number) => void;
  clearSelection?: () => void;
  onNewChat?: () => void;
  onNewGroup?: () => void;
}

export const Sidebar = memo(function Sidebar({
  contacts,
  groups,
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  selectedContact,
  handleContactSelect,
  loadingContacts,
  apiError,
  loadingGroups,
  groupError,
  selectedGroup,
  handleGroupSelect,
  clearSelection,
  onNewChat,
  onNewGroup
}: SidebarProps) {
  const handleTabChange = useCallback((tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      
      if (tab === 'contacts' && clearSelection) {
        clearSelection();
      }
    }
  }, [activeTab, setActiveTab, clearSelection]);

  const handleNewChat = useCallback(() => {
    if (onNewChat) onNewChat();
  }, [onNewChat]);

  const handleNewGroup = useCallback(() => {
    if (onNewGroup) onNewGroup();
  }, [onNewGroup]);

  const buttonTextRef = useRef<HTMLSpanElement>(null);
  const prevTabRef = useRef<TabType>(activeTab);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevTabRef.current = activeTab;
      return;
    }

    if (prevTabRef.current === activeTab || activeTab === 'contacts' || prevTabRef.current === 'contacts') {
      prevTabRef.current = activeTab;
      return;
    }
    
    if ((prevTabRef.current === 'chats' || prevTabRef.current === 'groups') && 
        (activeTab === 'chats' || activeTab === 'groups')) {
      
      const buttonText = buttonTextRef.current;
      if (!buttonText) return;
      
      const nextText = activeTab === 'chats' ? 'New Chat' : 'Create New Group';
      
      gsap.killTweensOf(buttonText);
      
      gsap.to(buttonText, {
        duration: 0.15,
        opacity: 0,
        y: -3,
        ease: "power1.in",
        onComplete: () => {
          buttonText.textContent = nextText;
          gsap.fromTo(buttonText, 
            { opacity: 0, y: 3 },
            { opacity: 1, y: 0, duration: 0.15 }
          );
        }
      });
    }
    
    prevTabRef.current = activeTab;
  }, [activeTab]);

  const tabButtons = (
    <div className="bg-white/10 dark:bg-gray-800/50 rounded-lg p-1 flex items-center will-change-transform transform-gpu">
      {['chats', 'groups', 'contacts'].map((tab) => (
        <button
          key={tab}
          className={cn(
            "flex items-center justify-center space-x-2 py-2 px-3 rounded-md flex-1 text-sm font-medium transition-all duration-200 will-change-transform transform-gpu",
            activeTab === tab
              ? "bg-white dark:bg-gray-700 text-violet-900 dark:text-violet-400 shadow-sm"
              : "text-white/90 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-700/30"
          )}
          onClick={() => handleTabChange(tab as TabType)}
          style={{ backfaceVisibility: "hidden" }}
        >
          {tab === 'chats' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
          {tab === 'groups' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
          {tab === 'contacts' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
        </button>
      ))}
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === 'chats') {
      return (
        <div className="space-y-1 px-2 transform-gpu">
          {loadingContacts ? (
            <div className="p-4 text-center text-white/80 dark:text-gray-400">
              Loading contacts...
            </div>
          ) : apiError ? (
            <div className="p-4 m-2 text-center bg-red-500/10 rounded-lg">
              <p className="text-red-300 dark:text-red-400 mb-2 text-sm font-medium">Failed to load contacts</p>
              <p className="text-xs text-white/80 dark:text-gray-400 mb-3">{apiError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md"
              >
                Retry
              </button>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-4 text-center text-white/80 dark:text-gray-400">
              No contacts found. Add some contacts to start chatting.
            </div>
          ) : (
            contacts.map(contact => (
              <ContactItem
                key={`chat-${contact.contact_id}`}
                contact={contact}
                isSelected={selectedContact === contact.contact_id.toString()}
                onSelect={handleContactSelect}
              />
            ))
          )}
        </div>
      );
    }
    
    if (activeTab === 'groups') {
      return (
        <div className="space-y-1 px-2 transform-gpu">
          {loadingGroups ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : groupError ? (
            <div className="p-4 text-center">
              <div className="text-red-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{groupError}</p>
              <button 
                className="mt-2 text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-center text-white/80 dark:text-gray-400 text-sm">
              No groups found. Create a new group to get started.
            </div>
          ) : (
            groups.map((group) => (
              <GroupItem 
                key={`group-${group.group_id}`}
                group={group}
                isSelected={selectedGroup === group.group_id}
                onSelect={handleGroupSelect}
              />
            ))
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-1 px-2 transform-gpu">
        {loadingContacts ? (
          <div className="p-4 text-center text-white/80 dark:text-gray-400">
            Loading contacts...
          </div>
        ) : apiError ? (
          <div className="p-4 m-2 text-center bg-red-500/10 rounded-lg">
            <p className="text-red-300 dark:text-red-400 mb-2 text-sm font-medium">Failed to load contacts</p>
            <p className="text-xs text-white/80 dark:text-gray-400 mb-3">{apiError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md"
            >
              Retry
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-4 text-center text-white/80 dark:text-gray-400">
            No contacts found. Add some contacts to start chatting.
          </div>
        ) : (
          contacts.map(contact => (
            <ContactItem
              key={`contact-${contact.contact_id}`}
              contact={contact}
              isSelected={selectedContact === contact.contact_id.toString()}
              onSelect={handleContactSelect}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "bg-gradient-to-b from-violet-900 to-violet-900/95 dark:from-gray-800 dark:to-gray-900 flex flex-col border-r border-violet-600/50 dark:border-gray-800 shadow-lg z-30",
        "transition-all duration-300 ease-in-out transform-gpu will-change-transform",
        "fixed inset-0 md:inset-y-0 md:left-0 md:w-80 md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{ minHeight: '100%', backfaceVisibility: "hidden" }}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 dark:border-gray-700/50">
        <div className="flex items-center">
          <div className="w-10 h-10 relative">
            <Image
              src="/images/logo-no-label.png"
              alt="Logo"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <h1 className="text-lg font-bold text-yellow-300 dark:text-yellow-300">
            LS<span className="text-white dark:text-white">Chat</span>
            <span className='text-purple-300 dark:text-purple-400'> Web</span>
          </h1>
        </div>
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center text-white hover:text-gray-200 dark:text-gray-500 dark:hover:text-gray-300"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages or contacts"
            className="w-full h-10 pl-10 pr-4 rounded-lg border-0 bg-white/10 dark:bg-gray-800/50 text-sm text-white dark:text-gray-300 placeholder-white/60 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-gray-600/50"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-white/70 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <div className="px-4 mb-2">
        {activeTab !== 'contacts' && (
          <button
            onClick={activeTab === 'chats' ? handleNewChat : handleNewGroup}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 transition-colors duration-200 text-white transform-gpu will-change-transform"
            style={{ backfaceVisibility: "hidden" }}
          >
            <svg 
              className="w-5 h-5 mr-2 will-change-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{ transform: "translateZ(0)", transformOrigin: "center" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span 
              ref={buttonTextRef} 
              className="font-medium will-change-transform"
              style={{ 
                minWidth: "80px", 
                display: "inline-block", 
                transform: "translateZ(0)", 
                transformOrigin: "center" 
              }}
            >
              {activeTab === 'chats' ? 'New Chat' : 'Create New Group'}
            </span>
          </button>
        )}
      </div>

      <div className="px-3 py-2 mb-2">
        {tabButtons}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent">
        {renderTabContent()}
      </div>
      
      {isOpen && activeTab !== 'contacts' && (
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button 
            onClick={activeTab === 'chats' ? handleNewChat : handleNewGroup}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                     bg-violet-500 hover:bg-violet-600 transition-colors duration-200 transform-gpu"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
});
