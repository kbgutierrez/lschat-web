'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { contactsAPI, ContactListItem, messagesAPI, fetchAPI } from '@/lib/api';
import { Group, GroupMessage, groupsAPI } from '@/lib/groupsApi';
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
import ProfileManagementModal from '@/components/dashboard/ProfileManagementModal';
import { GroupMessageList } from '@/components/dashboard/GroupMessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { RightPanel } from '@/components/dashboard/RightPanel';
import AddContactModal from '@/components/dashboard/AddContactModal';
import InviteToGroupModal from '@/components/dashboard/InviteToGroupModal';
import CreateGroupModal from '@/components/dashboard/CreateGroupModal';
import  UserManagementModal  from '@/components/dashboard/UserManagementModal';

type TabType = 'chats' | 'groups' | 'contacts';

export type ContactDetails = {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
  unread: number;
  profilePicture: string;
  contactPicture: string;
};

export default function Dashboard() {
  const isClient = useIsClient();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactDetails, setSelectedContactDetails] = useState<ContactDetails | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [pendingContacts, setPendingContacts] = useState<ContactListItem[]>([]);
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
  const fetchTimestampRef = useRef<Record<string, number>>({});

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isInviteToGroupModalOpen, setIsInviteToGroupModalOpen] = useState(false);
  const [inviteToGroupId, setInviteToGroupId] = useState<number | null>(null);

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groupMessages, setGroupMessages] = useState<Record<number, GroupMessage[]>>({});
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);
  const [groupMessageError, setGroupMessageError] = useState<string | null>(null);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<Group | null>(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  // Add state to control right panel visibility
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
  const [isNewlyCreatedGroup, setIsNewlyCreatedGroup] = useState(false);
  const [showInviteToast, setShowInviteToast] = useState(false);



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
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

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

        // Separate pending from regular contacts
        const pending = contactList.filter(contact => contact.status === 'pending');
        const regular = contactList.filter(contact => contact.status !== 'pending');
        
        setPendingContacts(pending);
        setContacts(regular);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setApiError(error instanceof Error ? error.message : 'Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [user, isClient, selectedContact, selectedGroup, activeTab]); 

  useEffect(() => {
      if (!isClient || !selectedContact) return;
  
      const contactDetails = contacts.find(contact => contact.contact_id.toString() === selectedContact);
      if (contactDetails) {
        setSelectedContactDetails({
          id: contactDetails.contact_id.toString(),
          name: contactDetails.contact_full_name,
          status: contactDetails.status || 'offline',  
          lastSeen: 'Unknown',
          unread: 0,
          profilePicture: contactDetails.user_picture || '',
          contactPicture: contactDetails.contact_picture || ''
        });
      
        setSelectedChannel(contactDetails.pubnub_channel);
      }
    }, [selectedContact, contacts, isClient]);

  const fetchMessagesFromApi = useCallback(async (skipCache = false, messageData?: any) => {
    if (!selectedChannel || !user || !isMounted) return;

    const now = Date.now();
    const lastFetch = fetchTimestampRef.current[selectedChannel] || 0;
    const timeSinceLastFetch = now - lastFetch;
    
    const isMessageNotification = messageData && 
      typeof messageData === 'object' && 
      (messageData.type === 'NEW_MESSAGE' || messageData.type === 'new_message' || 
       messageData.action === 'new_message');
    
    console.log(`[Message Check] Channel: ${selectedChannel}, Is notification: ${isMessageNotification}, ` + 
      `Last fetch: ${timeSinceLastFetch}ms ago, Skip cache: ${skipCache}`);
    
    if (isMessageNotification) {
      console.log('🔥 Notification received - FORCING message fetch');
      
      if (messagesAPI.invalidateCache) {
        messagesAPI.invalidateCache(selectedChannel);
      }
      
    } 
    else if (!skipCache && timeSinceLastFetch < 1000) {
      console.log(`Throttling regular fetch - last fetch was ${timeSinceLastFetch}ms ago`);
      return;
    }

    const hasExistingMessages = messages[selectedChannel]?.length > 0;
    if (!hasExistingMessages) {
      setLoadingMessages(true);
    }
    setMessageError(null);

    try {
      fetchTimestampRef.current[selectedChannel] = now;
      
      console.log(`📥 Fetching messages for channel: ${selectedChannel}`);
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
      
      const currentMessages = messages[selectedChannel] || [];
      if (currentMessages.length !== formattedMessages.length || 
          JSON.stringify(currentMessages.map(m => m.id)) !== 
          JSON.stringify(formattedMessages.map(m => m.id))) {
        
        console.log(`📨 Received ${formattedMessages.length} messages, updating state`);
        setMessages(prev => ({
          ...prev,
          [selectedChannel]: formattedMessages
        }));

        setTimeout(scrollToBottom, 100);
      } else {
        console.log('📊 No new messages detected, skipping update');
      }
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

  // Add fetchGroupMessagesFromApi declaration above the useEffect that uses it
  const fetchGroupMessagesFromApi = useCallback(async (skipCache = false, messageData?: any) => {
    if (!selectedGroup || !user || !isMounted) return;

    const now = Date.now();
    const fetchKey = `group-${selectedGroup}`;
    const lastFetch = fetchTimestampRef.current[fetchKey] || 0;
    const timeSinceLastFetch = now - lastFetch;
    
    const isMessageNotification = messageData && 
      typeof messageData === 'object' && 
      (messageData.type === 'NEW_MESSAGE' || messageData.type === 'new_message' || 
       messageData.action === 'new_message');
    
    console.log(`[Group Message Check] Group: ${selectedGroup}, Is notification: ${!!isMessageNotification}, ` + 
      `Last fetch: ${timeSinceLastFetch}ms ago, Skip cache: ${skipCache}`);
    
    if (isMessageNotification || skipCache) {
      console.log('🔥 Group notification received or skip cache - FORCING group message fetch');
    } 
    else if (timeSinceLastFetch < 1000) {
      console.log(`Throttling regular group fetch - last fetch was ${timeSinceLastFetch}ms ago`);
      return;
    }

    const hasExistingMessages = groupMessages[selectedGroup]?.length > 0;
    if (!hasExistingMessages) {
      setLoadingGroupMessages(true);
    }
    setGroupMessageError(null);

    try {
      fetchTimestampRef.current[fetchKey] = now;
      
      const messages = await groupsAPI.getGroupMessages(selectedGroup);
      if (!isMounted) return;
      console.log(`Retrieved ${messages.length} group messages`);
      const existingMessages = groupMessages[selectedGroup] || [];
      const hasNewMessages = existingMessages.length !== messages.length ||
        JSON.stringify(existingMessages.map(m => m.id)) !== 
        JSON.stringify(messages.map(m => m.id));
      
      if (hasNewMessages) {
        console.log('New group messages detected, updating state');
        setGroupMessages(prev => ({
          ...prev,
          [selectedGroup]: messages
        }));
        setTimeout(scrollToBottom, 100);
      } else {
        console.log('📊 No new group messages detected, skipping update');
      }
    } catch (error) {
      if (!isMounted) return;
      setGroupMessageError(
        error instanceof Error 
          ? error.message 
          : 'Failed to load group messages'
      );
    } finally {
      if (isMounted) {
        setLoadingGroupMessages(false);
      }
    }
  }, [selectedGroup, user, isMounted, scrollToBottom, groupMessages]);

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

  useEffect(() => {
    if (lastMessage && selectedChannel) {
      const isMessageNotification = 
        typeof lastMessage === 'object' && 
        (lastMessage.type === 'NEW_MESSAGE' || lastMessage.type === 'new_message' || 
         lastMessage.action === 'new_message');
      
      const isGroupMessage = lastMessage._isGroupMessage === true || 
                           (isMessageNotification && lastMessage.group_id !== undefined);
      
      if (isMessageNotification) {
        if (isGroupMessage) {
          if (selectedGroup && String(lastMessage.group_id) === String(selectedGroup)) {
            if (isMounted) {
              fetchGroupMessagesFromApi(true, lastMessage);
            }
          }
        } 
        else if (isMounted) {
          fetchMessagesFromApi(true, lastMessage);
        }
      }
    }
  }, [lastMessage, selectedChannel, selectedGroup, fetchMessagesFromApi, fetchGroupMessagesFromApi, isMounted]);

  useEffect(() => {
    if (!selectedContact) return;
    
    const presence = getContactPresence(selectedContact);
    
    // Update the selectedContactDetails
    setSelectedContactDetails(prev => {
      if (!prev) return null;
      
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
    
    // Also update the contacts array to sync status between sidebar and header
    setContacts(prev => {
      const updatedContacts = [...prev];
      const contactIndex = updatedContacts.findIndex(
        c => c.contact_id.toString() === selectedContact
      );
      
      if (contactIndex !== -1) {
        updatedContacts[contactIndex] = {
          ...updatedContacts[contactIndex],
          status: presence.isOnline ? 'online' : 'offline'
        };
      }
      
      return updatedContacts;
    });
  }, [selectedContact, getContactPresence]);

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

  useEffect(() => {
    if (lastMessage) {
      setLastPubnubMessage(lastMessage);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (pubnubError) {
      console.error('PubNub error:', pubnubError);
    }
  }, [pubnubError]);
  
  const prevSubscribedRef = useRef(isSubscribed);
  useEffect(() => {
    if (selectedChannel && prevSubscribedRef.current !== isSubscribed) {
      prevSubscribedRef.current = isSubscribed;
    }
  }, [selectedChannel, isSubscribed]);

  useEffect(() => {
    if (!isClient || !selectedChannel) return;
    
    if (messages[selectedChannel] === undefined) {
      fetchMessagesFromApi(false);
    } else {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedChannel, fetchMessagesFromApi, isClient, messages, scrollToBottom]);

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

  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleUserManagementModal = () => {
    setIsUserManagementModalOpen(true);
  }

  const handleContactSelect = (id: string) => {
    setSelectedContact(id);
    setSelectedGroup(null); 
    const contactDetails = contacts.find(contact => contact.contact_id.toString() === id);
    if (contactDetails) {
      setSelectedContactDetails({
        id: contactDetails.contact_id.toString(),
        name: contactDetails.contact_full_name,
        status: contactDetails.status || 'offline',
        lastSeen: 'Unknown',
        unread: 0,
        profilePicture: contactDetails.contact_picture || '',
        contactPicture: contactDetails.contact_picture || ''
      });
      
      // Only set the channel if the contact is not pending
      if (contactDetails.status !== 'pending') {
        setSelectedChannel(contactDetails.pubnub_channel);
      } else {
        // Clear the channel if contact is pending to prevent messaging
        setSelectedChannel(null);
      }
    }
    setIsMobileSidebarOpen(false);
  };

  const handleGroupSelect = (id: number) => {
    setSelectedGroup(id);
    setSelectedContact(null); 
    
    const groupDetails = groups.find(g => g.group_id === id);
    console.log('Selected Group PubNub Channel:', groupDetails?.pubnub_channel);
    console.log('Group Details:', groupDetails);
    
    if (groupDetails?.pubnub_channel) {
      console.log('Setting PubNub channel for group messaging:', groupDetails.pubnub_channel);
      setSelectedChannel(groupDetails.pubnub_channel);
    } else {
      console.warn('No PubNub channel found for this group, notifications will not work');
      setSelectedChannel(null);
    }
    
    setIsMobileSidebarOpen(false);
  };

  const handleNewContact = useCallback(() => {
    setIsAddContactModalOpen(true);
  }, []);
  
  
  const pendingContactsRef = useRef<ContactListItem[]>([]);
  const isRefreshingContactsRef = useRef<boolean>(false);
  
  const refreshPendingContacts = useCallback(async (silent: boolean = false) => {
    if (!user?.user_id || isRefreshingContactsRef.current) return;
    
    try {
      isRefreshingContactsRef.current = true;
      
      if (!silent) {
        setLoadingContacts(true);
      }
      
      const contactList = await contactsAPI.getContactList(user.user_id);
      const pending = contactList.filter(contact => contact.status === 'pending');
      const regular = contactList.filter(contact => contact.status !== 'pending');
      
      const pendingChanged = JSON.stringify(pending) !== JSON.stringify(pendingContactsRef.current);
      
      if (pendingChanged) {
        setPendingContacts(pending);
        pendingContactsRef.current = pending;
      }
      
      if (!silent) {
        setContacts(regular);
      }
      
      return pendingChanged;
    } catch (error) {
      console.error('Error refreshing pending contacts:', error);
      return false;
    } finally {
      if (!silent) {
        setLoadingContacts(false);
      }
      isRefreshingContactsRef.current = false;
    }
  }, [user?.user_id]);
  
  useEffect(() => {
    if (!user?.user_id) return;
    
    const intervalId = setInterval(() => {
      refreshPendingContacts(true);
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, [user?.user_id, refreshPendingContacts]);

  const handleAddContact = async (contactId: number) => {
    if (!user?.user_id) return;
    
    try {
      await fetchAPI('/api/add-contact-to-list', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.user_id,
          contact_id: contactId
        })
      }, true);
      
      await refreshPendingContacts(false);
      const updatedContacts = await contactsAPI.getContactList(user.user_id);
      setContacts(updatedContacts.filter(c => c.status !== 'pending'));
      
      return true;
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    }
  };

  const handleCancelContactRequest = async (contactId: number) => {
    if (!user?.user_id) return;
    
    try {
      await fetchAPI('/api/remove-contact', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.user_id,
          contact_id: contactId
        })
      }, true);
      
      const updatedContacts = await contactsAPI.getContactList(user.user_id);
      const pending = updatedContacts.filter(contact => contact.status === 'pending');
      const regular = updatedContacts.filter(contact => contact.status !== 'pending');
      
      setPendingContacts(pending);
      setContacts(regular);
      
    } catch (error) {
      console.error('Failed to cancel contact request:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!isClient || !selectedGroup) return;
    
    const groupDetails = groups.find(g => g.group_id === selectedGroup);
    if (groupDetails) {
      setSelectedGroupDetails(groupDetails);
    }
    
    if (groupMessages[selectedGroup] === undefined) {
      fetchGroupMessagesFromApi(false);
    } else {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedGroup, fetchGroupMessagesFromApi, isClient, groups, groupMessages, scrollToBottom]);

  const handleRetryLoadGroupMessages = useCallback(() => {
    if (selectedGroup) {
      fetchGroupMessagesFromApi(true);
    }
  }, [selectedGroup, fetchGroupMessagesFromApi]);

  const handleSendGroupMessage = useCallback(async (message: string, file?: File) => {
    if ((!message.trim() && !file) || !selectedGroup || !user || !user.user_id) return;

    const optimisticMessage = file 
      ? `Sending ${file.name}...` 
      : message;
      
    const optimisticMsg: GroupMessage = {
      id: Date.now(), 
      sender_id: Number(user.user_id),
      sender_name: `${user.firstName} ${user.lastName}`.trim() || user.username || 'Me',
      message: optimisticMessage,
      created_at: new Date().toISOString()
    };

    try {

      // Add message to UI
      setGroupMessages(prev => ({
        ...prev,
        [selectedGroup]: [...(prev[selectedGroup] || []), optimisticMsg]
      }));
      
      setTimeout(scrollToBottom, 100);

      // Send the actual message
      const response = await groupsAPI.sendGroupMessage(
        selectedGroup, 
        user.user_id, 
        message,
        file
      );
      
      // Update with the server response
      setGroupMessages(prev => {
        const messages = [...(prev[selectedGroup] || [])];
        const index = messages.findIndex(m => m.id === optimisticMsg.id);
        
        if (index !== -1) {
          messages[index] = response;
        }
   
        return {
          ...prev,
          [selectedGroup]: messages
        };
      });
      
      // Refetch messages to be sure we have the latest
      fetchGroupMessagesFromApi(true);
      
    } catch (error) {
      console.error('Failed to send group message:', error);
      setGroupMessages(prev => {
        const updatedMessages = (prev[selectedGroup] || []).map(msg => 
          msg.id === optimisticMsg.id ? {
            ...msg,
            message: `Failed to send message${file ? ` (${file.name})` : ''}: ${error instanceof Error ? error.message : 'Unknown error'}`
          } : msg
        );
        
        return {
          ...prev,
          [selectedGroup]: updatedMessages
        };
      });
    }
  }, [selectedGroup, user, scrollToBottom, fetchGroupMessagesFromApi]);

  const handleSendMessage = useCallback(async (message: string, file?: File) => {
    if ((!message.trim() && !file) || !selectedChannel || !user) return;

    try {
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        sender: user.user_id?.toString() || 'me',
        text: file ? `Sending ${file.name}...` : message,
        time: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: 'numeric', 
          hour12: true 
        }),
        isOwn: true,
        type: file ? 'file' : 'text',
        isRead: false
      };

      setMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), optimisticMsg]
      }));
      
      setTimeout(scrollToBottom, 100);

      const response = await messagesAPI.sendMessage(selectedChannel, message, file);
      
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
      
      if (isClient) {
        setMessages(prev => {
          const updatedChannelMessages = prev[selectedChannel].map(msg => 
            msg.id.startsWith('temp-') ? {
              ...msg,
              text: `Failed to send message${file ? ` (${file.name})` : ''}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              type: 'error'
            } : msg
          );
          
          return {
            ...prev,
            [selectedChannel]: updatedChannelMessages
          };
        });
      }
    }
  }, [selectedChannel, user, scrollToBottom, isClient]);

  const clearSelection = useCallback(() => {
    setSelectedContact(null);
    setSelectedGroup(null);
    setSelectedContactDetails(null);
    setSelectedGroupDetails(null);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      
      if (tab === 'contacts') {
        clearSelection();
        refreshPendingContacts();
      }
      
      if (!tabsVisited[tab]) {
        setTabsVisited(prev => ({
          ...prev,
          [tab]: true
        }));
      }
    }
  }, [activeTab, tabsVisited, clearSelection, refreshPendingContacts]);

  const handleRetryLoadMessages = useCallback(() => {
    if (selectedChannel) {
      fetchMessagesFromApi(true);
    }
  }, [selectedChannel, fetchMessagesFromApi]);

  // Add a function to refresh groups
  const refreshGroups = useCallback(async () => {
    if (!isClient || !user || !user.user_id) return;
    
    try {
      setLoadingGroups(true);
      setGroupError(null);
      
      console.log("Refreshing groups for user ID:", user.user_id);
      const groupsList = await groupsAPI.getGroups(user.user_id);
      
      const enhancedGroups: GroupData[] = groupsList.map(group => ({
        ...group,
        lastMessage: "",
        lastMessageTime: new Date(group.created_at).toLocaleDateString()
      }));

      setGroups(enhancedGroups);
    } catch (error) {
      console.error('Error refreshing groups:', error);
      setGroupError(error instanceof Error ? error.message : 'Failed to refresh groups');
    } finally {
      setLoadingGroups(false);
    }
  }, [user, isClient, setGroups, setLoadingGroups, setGroupError]);

  useEffect(() => {
    if (!isClient || !user) return;

    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        setGroupError(null);

        const userId = user.user_id;

        if (!userId) {
          console.error("Cannot fetch groups: User ID is missing");
          setGroupError("User ID is missing. Please log out and log in again.");
          setLoadingGroups(false);
          return;
        }

        console.log("Fetching groups for user ID:", userId);
        const groupsList = await groupsAPI.getGroups(userId);
        
        const enhancedGroups: GroupData[] = groupsList.map(group => ({
          ...group,
          lastMessage: "",
          lastMessageTime: new Date(group.created_at).toLocaleDateString()
        }));

        setGroups(enhancedGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setGroupError(error instanceof Error ? error.message : 'Failed to load groups');
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [user, isClient]);

  useEffect(() => {
    if (selectedGroup && selectedChannel) {
      console.log(`Group PubNub subscription status for channel ${selectedChannel}:`, isSubscribed);
      console.log(`Current PubNub connection status:`, isSubscribed ? 'Connected' : 'Disconnected');
    }
  }, [selectedGroup, selectedChannel, isSubscribed]);

  const handleNewChat = useCallback(() => {

    handleTabChange('contacts');
  }, [handleTabChange]);
  
  const handleNewGroup = useCallback(() => {
    console.log('Creating new group');
    setIsCreateGroupModalOpen(true); // Add this line to open the modal
  }, []);

  useEffect(() => {
    const handleProfilePictureUpdate = (event: CustomEvent) => {
      if (user) {
        const updatedUser = {
          ...user,
          profilePicture: event.detail.profilePicture
        };
        setUser(updatedUser);
        console.log('Dashboard updated user profile picture:', event.detail.profilePicture);
      }
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    };
  }, [user]);

  // Add leave group handler
  const handleLeaveGroup = async (groupId: number) => {
    if (!user?.user_id) return;
    try {
      await groupsAPI.leaveGroup(groupId, user.user_id);
      // Remove group from state
      setGroups(prev => prev.filter(g => g.group_id !== groupId));
      // If currently selected, clear selection
      if (selectedGroup === groupId) {
        setSelectedGroup(null);
        setSelectedGroupDetails(null);
        setSelectedChannel(null);
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  };

  const openInviteToGroupModal = useCallback((groupId: number) => {
    setInviteToGroupId(groupId);
    setIsInviteToGroupModalOpen(true);
  }, []);

  const handleInviteToGroup = useCallback(async (groupId: number, userId: number, role:string): Promise<void> => {
    if (!user?.user_id) return;
    
    try {
      await groupsAPI.inviteToGroup(groupId, userId, role);
    } catch (error) {
      console.error('Failed to invite user to group:', error);
      throw error;
    }
  }, [user?.user_id]);

  const handleCreateGroup = useCallback(async (name: string, description: string) => {
    if (!user?.user_id) return;
    
    try {
      console.log('Creating group:', name, description);
      
      // Step 1: Create the group via API
      const newGroup = await groupsAPI.createGroup(name, description, user.user_id);
      console.log('Group created successfully:', newGroup);
      
      // Step 2: Close the modal immediately
      setIsCreateGroupModalOpen(false);
      
      // Step 3: Immediately fetch the complete groups list to ensure UI consistency
      const groupsList = await groupsAPI.getGroups(user.user_id);
      
      const enhancedGroups: GroupData[] = groupsList.map(group => ({
        ...group,
        lastMessage: "",
        lastMessageTime: new Date(group.created_at).toLocaleDateString()
      }));
      
      // Step 4: Update the groups state with fresh data from server
      setGroups(enhancedGroups);
      
      // Step 5: Find the newly created group in the fetched list
      const freshGroup = groupsList.find(g => g.group_id === newGroup.group_id);
      
      if (freshGroup) {
        // Step 6: Set the selected group details and navigate to it
        setSelectedGroup(freshGroup.group_id);
        setSelectedContact(null);
        setSelectedGroupDetails(freshGroup);
        setSelectedChannel(freshGroup.pubnub_channel);
        setActiveTab('groups');
        
        // Step 7: Show the right panel and mark as newly created
        setIsRightPanelVisible(true);
        setIsNewlyCreatedGroup(true);
        
        // Show the toast notification
        setShowInviteToast(true);
        
        // Reset the new group flag after 5 seconds
        setTimeout(() => {
          setIsNewlyCreatedGroup(false);
          setShowInviteToast(false);
        }, 5000);
      } else {
        console.error('Created group not found in fetched groups list');
      }
      
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }, [user?.user_id, setActiveTab]);

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
        groups={groups}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        selectedContact={selectedContact}
        selectedGroup={selectedGroup}
        handleContactSelect={handleContactSelect}
        handleGroupSelect={handleGroupSelect}
        loadingContacts={loadingContacts}
        loadingGroups={loadingGroups}
        apiError={apiError}
        groupError={groupError}
        clearSelection={clearSelection}
        onNewChat={handleNewChat}
        onNewGroup={handleNewGroup}
        onNewContact={handleNewContact} 
        messages={messages}
        onRemoveContact={handleCancelContactRequest}
        onLeaveGroup={handleLeaveGroup}
        refreshPendingContacts={refreshPendingContacts}
        isCreateGroupModalOpen={isCreateGroupModalOpen}
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
          contactDetails={selectedContact ? selectedContactDetails : null}
          groupDetails={selectedGroup ? selectedGroupDetails : null}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={handleLogout}
          onOpenProfileModal={handleOpenProfileModal}
          onOpenUserManagementModal={handleUserManagementModal}
          onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
          channelId={selectedChannel}
          pubnubConnected={isSubscribed}
          lastMessage={lastPubnubMessage}
          onGroupInvitationAccepted={refreshGroups} 
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

        <div className="flex-1 flex overflow-hidden relative">
          {/* Added md:pr-80 to make space for the always-visible right panel on desktop */}
          <div className="flex-1 flex flex-col overflow-hidden md:pr-0">
            {selectedContact ? (
              <ChatArea 
                selectedContact={selectedContact}
                contactName={selectedContactDetails?.name || ''}
                contactPicture={selectedContactDetails?.contactPicture || ''}
                messages={selectedChannel ? messages[selectedChannel] || [] : []}
                loadingMessages={loadingMessages}
                messageError={messageError}
                handleRetryLoadMessages={handleRetryLoadMessages}
                handleSendMessage={handleSendMessage}
                handleTyping={handleTypingChange}
                selectedChannel={selectedChannel}
                isTyping={isContactTyping}
                isPending={selectedContactDetails?.status === 'pending'} // Pass pending status to ChatArea
              />
            ) : selectedGroup ? (
              <div className="flex-1 flex flex-col bg-violet-50 dark:bg-gray-950 overflow-hidden">
                <div 
                  ref={containerRef}
                  className="chat-messages-container flex-1 overflow-y-auto no-scrollbar" 
                  style={{ 
                    height: "calc(100% - 80px)", 
                    display: "flex",
                    flexDirection: "column",
                    scrollBehavior: "auto"
                  }}
                >
                  <div className="p-4 space-y-3 flex-1"> 
                    <div className="flex justify-center my-4">
                      <div className="px-3 py-1 bg-violet-100 dark:bg-gray-800 rounded-full">
                        <span className="text-xs text-black dark:text-gray-400">
                          {selectedGroupDetails?.name || 'Group Chat'}
                        </span>
                      </div>
                    </div>

                    <div className="relative min-h-[200px]">
                      <GroupMessageList 
                        messages={groupMessages[selectedGroup] || []}
                        groupName={selectedGroupDetails?.name || 'Group'}
                        isLoading={loadingGroupMessages}
                        error={groupMessageError}
                        onRetry={handleRetryLoadGroupMessages}
                        endRef={messagesEndRef}
                        currentUserId={user?.user_id}
                      />
                    </div>
                    
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </div>

                <MessageInput 
                  onSendMessage={handleSendGroupMessage}
                  disabled={!selectedGroup}
                />
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
          
          <RightPanel
            contactDetails={selectedContact ? selectedContactDetails : null}
            groupDetails={selectedGroup ? selectedGroupDetails : null}
            isVisible={isRightPanelVisible}
            onClose={() => setIsRightPanelVisible(false)}
            pendingContacts={pendingContacts}
            activeTab={activeTab}
            onContactSelect={handleContactSelect}
            loadingContacts={loadingContacts}
            onCancelContactRequest={handleCancelContactRequest}
            refreshPendingContacts={refreshPendingContacts}
            onInviteToGroup={openInviteToGroupModal}
            isNewGroup={isNewlyCreatedGroup}
          />
        </div>
      </main>
      
      <ProfileManagementModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
      />

      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onAddContact={handleAddContact}
        existingContacts={contacts}
        currentUserId={user?.user_id}
        onContactAdded={refreshPendingContacts}  
      />

      <InviteToGroupModal
        isOpen={isInviteToGroupModalOpen}
        onClose={() => setIsInviteToGroupModalOpen(false)}
        contacts={contacts}
        groupId={inviteToGroupId}
        onInvite={ handleInviteToGroup }
        groupName={selectedGroupDetails?.name}
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreate={handleCreateGroup}
      />

      {/* Improved toast notification */}
      {showInviteToast && (
        <div className="fixed top-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 border-violet-500 dark:border-violet-600 overflow-hidden z-50 animate-slide-in-right">
          <div className="px-4 py-3 flex items-center">
            <div className="shrink-0 bg-violet-100 dark:bg-violet-900/30 p-2 rounded-full mr-3">
              <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 mr-2">
              <p className="font-medium text-gray-900 dark:text-white">Group created successfully!</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Add members using the invite button in the right panel</p>
            </div>
            <button 
              onClick={() => setShowInviteToast(false)}
              className="shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-1 bg-violet-500 dark:bg-violet-600 animate-toast-timer"></div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        @keyframes toast-timer {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-timer {
          animation: toast-timer 5s linear forwards;
        }
      `}</style>
    </div>
  );
}
