'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { contactsAPI, ContactListItem, messagesAPI } from '@/lib/api';
import { useIsClient, getUserFromLocalStorage, User } from '@/lib/clientUtils';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ChatHeader } from '@/components/dashboard/ChatHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ChatArea } from '@/components/dashboard/ChatArea';
import { Message } from '@/components/dashboard/MessageItem';
import { GroupData } from '@/components/dashboard/GroupItem';
import { usePubnubTrigger } from '@/hooks/usePubnubTrigger';
import { PubnubStatus } from '@/components/dashboard/PubnubStatus';
import { publishTypingIndicator } from '@/lib/pubnub';

// Sample groups data
const sampleGroups: GroupData[] = [
  {
    id: 'g1',
    name: 'Marketing Team',
    members: ['1', '3', '4'],
    lastMessage: 'Let\'s discuss the campaign',
    lastMessageTime: '1:45 PM',
    unread: 2
  },
  {
    id: 'g2',
    name: 'IT Department',
    members: ['2', '4'],
    lastMessage: 'Server maintenance scheduled',
    lastMessageTime: 'Yesterday',
    unread: 0
  },
  {
    id: 'g3',
    name: 'Project X',
    members: ['1', '2', '3'],
    lastMessage: 'Updated timeline for review',
    lastMessageTime: 'Monday',
    unread: 5
  }
];

type TabType = 'chats' | 'groups' | 'contacts';

type ContactDetails = {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
  unread: number;
};

export default function Dashboard() {
  const isClient = useIsClient();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactDetails, setSelectedContactDetails] = useState<ContactDetails | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [tabsVisited, setTabsVisited] = useState<Record<TabType, boolean>>({
    chats: true,
    groups: false,
    contacts: false
  });
  const [pubnubNotification, setPubnubNotification] = useState<{
    channelId: string;
    timestamp: number;
  } | null>(null);
  const [lastPubnubMessage, setLastPubnubMessage] = useState<any>(null);
  const [isContactTyping, setIsContactTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Make scroll to bottom instant instead of smooth
  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return;
    
    try {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "instant",
        block: 'end',
      });
      
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    } catch (err) {
      // Keep error handling but remove logging
    }
  }, []);

  // Component mount
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Auth check
  useEffect(() => {
    if (!isClient) return;

    const userData = getUserFromLocalStorage();

    if (userData) {
      setUser(userData);
      setCheckingAuth(false);
    } else {
      router.push('/auth');
    }
  }, [isClient, router]);

  // Fetch contacts
  useEffect(() => {
    if (!isClient || !user) return;

    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        setApiError(null);

        const userId = user.user_id;

        if (!userId) {
          console.error("Cannot fetch contacts: User ID is missing");
          setApiError("User ID is missing. Please log out and log in again.");
          setLoadingContacts(false);
          return;
        }

        console.log("Fetching contacts for user ID:", userId);
        const contactList = await contactsAPI.getContactList(userId);

        setContacts(contactList);

        if (contactList.length > 0 && !selectedContact) {
          setSelectedContact(contactList[0].contact_id.toString());
          setSelectedContactDetails({
            id: contactList[0].contact_id.toString(),
            name: contactList[0].contact_full_name,
            status: 'offline',
            lastSeen: 'Unknown',
            unread: 0
          });
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setApiError(error instanceof Error ? error.message : 'Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [user, isClient, selectedContact]);

  // Set contact details and channel when contact is selected
  useEffect(() => {
    if (!isClient || !selectedContact) return;

    const contactDetails = contacts.find(contact => contact.contact_id.toString() === selectedContact);
    if (contactDetails) {
      setSelectedContactDetails({
        id: contactDetails.contact_id.toString(),
        name: contactDetails.contact_full_name,
        status: 'offline', // Default value
        lastSeen: 'Unknown',
        unread: 0
      });
      
      setSelectedChannel(contactDetails.pubnub_channel);
    }
  }, [selectedContact, contacts, isClient]);

  // Function to fetch messages from API - used by both initial load and PubNub
  const fetchMessagesFromApi = useCallback(async (skipCache = false, messageData?: any) => {
    if (!selectedChannel || !user || !isMounted) return;

    if (messageData) {
      setLastPubnubMessage(messageData);
    }

    if (!skipCache && messages[selectedChannel]?.length > 0) {
      setTimeout(scrollToBottom, 100);
      return;
    }
    
    setLoadingMessages(true);
    setMessageError(null);

    try {
      const chatMessages = await messagesAPI.getChatMessages(selectedChannel);
      
      if (!isMounted) return;
      
      const formattedMessages = chatMessages.map(msg => ({
        id: msg.message_id.toString(),
        sender: msg.user_id.toString(),
        text: msg.message_content,
        time: new Date(msg.created_at.replace('Z', '')).toLocaleString('en-PH', { 
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric', 
          minute: 'numeric', 
          hour12: true 
        }),
        isOwn: msg.user_id.toString() === user.user_id?.toString(),
        type: msg.message_type,
        isRead: msg.is_read
      }));
      
      setMessages(prev => ({
        ...prev,
        [selectedChannel]: formattedMessages
      }));

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      if (!isMounted) return;
      setMessageError(
        error instanceof Error 
          ? error.message 
          : 'Failed to load messages'
      );
    } finally {
      if (isMounted) {
        setLoadingMessages(false);
      }
    }
  }, [selectedChannel, user, isMounted, scrollToBottom, messages]);

  // Use a more aggressive approach to ensure scrolling happens immediately
  useEffect(() => {
    if (!selectedChannel || !messages[selectedChannel]) return;
    
    scrollToBottom();
    
    const scrollTimer = setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 50);
    
    return () => clearTimeout(scrollTimer);
  }, [selectedChannel, messages, scrollToBottom]);

  // Function to handle typing indicators received from PubNub
  const handleTypingIndicator = useCallback((typingData: { userId: string, isTyping: boolean, timestamp: number }) => {
    if (typingData.userId === user?.user_id?.toString()) return;
    
    setTypingUserId(typingData.userId);
    setIsContactTyping(typingData.isTyping);
    
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    if (typingData.isTyping) {
      typingTimerRef.current = setTimeout(() => {
        setIsContactTyping(false);
      }, 3000);
    }
  }, [user?.user_id]);

  // Connect to PubNub for real-time updates
  const { 
    isSubscribed, 
    error: pubnubError, 
    lastMessage, 
    getContactPresence 
  } = usePubnubTrigger(
    selectedChannel,
    user?.user_id?.toString(),
    fetchMessagesFromApi,
    handleTypingIndicator
  );

  // Update the contact status from presence data - FIX INFINITE LOOP
  useEffect(() => {
    if (!selectedContact) return;
    
    const presence = getContactPresence(selectedContact);
    
    setSelectedContactDetails(prev => {
      if (!prev) return null;
      
      // Only update if values actually changed to prevent unnecessary re-renders
      if (prev.status === (presence.isOnline ? 'online' : 'offline') && 
          prev.lastSeen === presence.lastSeen) {
        return prev;
      }
      
      return {
        ...prev,
        status: presence.isOnline ? 'online' : 'offline',
        lastSeen: presence.lastSeen
      };
    });
  }, [selectedContact, getContactPresence]);

  // Handler for sending typing indicators
  const handleTypingChange = useCallback((isTyping: boolean) => {
    if (!selectedChannel || !user?.user_id) return;
    
    try {
      publishTypingIndicator(
        selectedChannel,
        user.user_id.toString(),
        isTyping
      );
    } catch (error) {
      console.error('Error publishing typing indicator:', error);
    }
  }, [selectedChannel, user?.user_id]);

  // Update last message when we receive a new one
  useEffect(() => {
    if (lastMessage) {
      setLastPubnubMessage(lastMessage);
    }
  }, [lastMessage]);

  // Log PubNub errors but don't show status log spam
  useEffect(() => {
    if (pubnubError) {
      console.error('PubNub error:', pubnubError);
    }
  }, [pubnubError]);
  
  const prevSubscribedRef = useRef(isSubscribed);
  useEffect(() => {
    if (selectedChannel && prevSubscribedRef.current !== isSubscribed) {
      prevSubscribedRef.current = isSubscribed;
      console.log(`PubNub is now ${isSubscribed ? 'connected' : 'disconnected'} to channel: ${selectedChannel}`);
    }
  }, [selectedChannel, isSubscribed]);

  useEffect(() => {
    if (!isClient || !selectedChannel) return;
    fetchMessagesFromApi(false);
  }, [selectedChannel, fetchMessagesFromApi, isClient]);

  useEffect(() => {
    if (!isClient) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [selectedContact, isClient]);

  const handleLogout = () => {
    if (!isClient) return;
    try {
      localStorage.removeItem('userSession');
      router.push('/auth');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleContactSelect = (id: string) => {
    setSelectedContact(id);
    const contactDetails = contacts.find(contact => contact.contact_id.toString() === id);
    if (contactDetails) {
      setSelectedContactDetails({
        id: contactDetails.contact_id.toString(),
        name: contactDetails.contact_full_name,
        status: 'offline',
        lastSeen: 'Unknown',
        unread: 0
      });
    }
    setIsMobileSidebarOpen(false);
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !selectedChannel || !user) return;

    try {
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        sender: user.user_id?.toString() || 'me',
        text: message,
        time: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: 'numeric', 
          hour12: true 
        }),
        isOwn: true,
        type: 'text',
        isRead: false
      };

      setMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), optimisticMsg]
      }));
      
      setTimeout(scrollToBottom, 100);

      const response = await messagesAPI.sendMessage(selectedChannel, message);
      
      setMessages(prev => {
        const updatedChannelMessages = prev[selectedChannel].map(msg => 
          msg.id === optimisticMsg.id ? {
            id: response.message_id.toString(),
            sender: response.user_id.toString(),
            text: response.message_content,
            time: new Date(response.created_at).toLocaleTimeString('en-US', {
              hour: 'numeric', 
              minute: 'numeric', 
              hour12: true 
            }),
            isOwn: true,
            type: response.message_type,
            isRead: response.is_read
          } : msg
        );
        
        return {
          ...prev,
          [selectedChannel]: updatedChannelMessages
        };
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [selectedChannel, user, scrollToBottom]);

  const handleTabChange = useCallback((tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      if (!tabsVisited[tab]) {
        setTabsVisited(prev => ({
          ...prev,
          [tab]: true
        }));
      }
    }
  }, [activeTab, tabsVisited]);

  const handleRetryLoadMessages = useCallback(() => {
    if (selectedChannel) {
      fetchMessagesFromApi(true);
    }
  }, [selectedChannel, fetchMessagesFromApi]);

  if (!isClient) {
    return <div className="min-h-screen bg-violet-50 dark:bg-gray-950"></div>;
  }
  
  if (checkingAuth) {
    return <div className="min-h-screen bg-violet-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-400 border-t-transparent"></div>
    </div>;
  }
  
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-violet-50 dark:bg-gray-950 overflow-hidden relative">
      <Sidebar 
        contacts={contacts}
        groups={sampleGroups}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        selectedContact={selectedContact}
        handleContactSelect={handleContactSelect}
        loadingContacts={loadingContacts}
        apiError={apiError}
      />

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-violet-900/20 backdrop-blur-sm md:hidden z-20"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      <main className="flex-1 flex flex-col h-full w-full">
        <ChatHeader 
          user={user}
          contactDetails={selectedContactDetails}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={handleLogout}
          channelId={selectedChannel}
          pubnubConnected={isSubscribed}
          lastMessage={lastPubnubMessage}
        />
        
        {selectedChannel && (
          <div className="flex justify-center">
            <PubnubStatus
              isConnected={isSubscribed}
              channelId={selectedChannel}
              lastMessage={lastPubnubMessage}
              className="mx-auto -mt-1 mb-2"
            />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {selectedContact ? (
            <ChatArea 
              selectedContact={selectedContact}
              contactName={selectedContactDetails?.name || ''}
              messages={selectedChannel ? messages[selectedChannel] || [] : []}
              loadingMessages={loadingMessages}
              messageError={messageError}
              handleRetryLoadMessages={handleRetryLoadMessages}
              handleSendMessage={handleSendMessage}
              handleTyping={handleTypingChange}
              selectedChannel={selectedChannel}
              isTyping={isContactTyping}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}
