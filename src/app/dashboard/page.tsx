'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { contactsAPI, ContactListItem, messagesAPI, ChatMessage } from '@/lib/api';
import { useIsClient, getUserFromLocalStorage, User } from '@/lib/clientUtils';
import { MessageContent } from '@/components/chat/MessageContent';
import { MessageInput } from '@/components/chat/MessageInput';

type Message = {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
  type?: string;
  isRead?: boolean;
};

type MessagesCollection = {
  [key: string]: Message[];
};

const sampleMessages: MessagesCollection = {
  '2': [
    { id: 'm1', sender: '2', text: 'Pare, kumusta?', time: '9:20 AM', isOwn: false },
    { id: 'm2', sender: 'me', text: 'Hahaha', time: '9:22 AM', isOwn: true },
    { id: 'm3', sender: '2', text: 'Barilin kita', time: '9:25 AM', isOwn: false },
    { id: 'm4', sender: 'me', text: 'Barilin din kita!', time: '9:26 AM', isOwn: true },
    { id: 'm5', sender: '2', text: 'Paalam', time: '9:30 AM', isOwn: false },
  ]
};

// Sample groups data
const sampleGroups = [
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

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getAvatarColor = (name: string): string => {
  return 'bg-blue-500 text-white';
};

// Add the missing compareMessageTimestamps function
const compareMessageTimestamps = (timeA: string, timeB: string): boolean => {
  try {
    return timeA !== timeB;
  } catch (e) {
    return true;
  }
};

type TabType = 'chats' | 'groups' | 'contacts';

type ContactDetails = {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
  unread: number;
};

// Memoize the message component to prevent re-renders
const MessageItem = memo(({ message, contactName, isFirst, prevTime }: { 
  message: Message, 
  contactName: string,
  isFirst: boolean,
  prevTime: string | null
}) => {
  const showAvatar = isFirst || 
    (!message.isOwn && prevTime && compareMessageTimestamps(message.time, prevTime));

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
      {!message.isOwn && (
        <div className="flex-shrink-0 mr-3">
          {showAvatar && (
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "bg-blue-500 text-white"
            )}>
              <span className="text-xs font-medium">{getInitials(contactName)}</span>
            </div>
          )}
        </div>
      )}

      <div className={cn(
        "max-w-[75%]",
        message.isOwn ? "items-end" : "items-start",
        "flex flex-col"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-2xl relative",
          message.isOwn
            ? "bg-violet-600 text-white"
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-violet-100 dark:border-gray-700",
          message.isOwn ? "rounded-tr-none" : "rounded-tl-none"
        )}>
          <MessageContent 
            content={message.text} 
            className="text-sm"
          />
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {message.time}
          {message.isOwn && message.isRead && (
            <span className="ml-1 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </span>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

// Memoize the message list to prevent re-renders
const MessageList = memo(({ 
  messages, 
  contactName, 
  isLoading, 
  error, 
  onRetry, 
  endRef 
}: { 
  messages: Message[], 
  contactName: string,
  isLoading: boolean,
  error: string | null,
  onRetry: () => void,
  endRef: React.RefObject<HTMLDivElement | null>
}) => {
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-violet-50/80 dark:bg-gray-950/80 backdrop-blur-[1px] z-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
        rounded-md p-4 text-center text-red-600 dark:text-red-400">
        <p>{error}</p>
        <button 
          onClick={onRetry}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 dark:bg-gray-800 rounded-full mb-4">
          <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          contactName={contactName}
          isFirst={index === 0}
          prevTime={index > 0 ? messages[index - 1].time : null}
        />
      ))}
      <div ref={endRef} className="h-1" />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default function Dashboard() {
  const isClient = useIsClient();
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactDetails, setSelectedContactDetails] = useState<ContactDetails | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  const contactsByTab = useMemo(() => {
    return {
      chats: contacts,
      contacts: contacts,
      groups: [] // Using sample groups instead
    };
  }, [contacts]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "instant",
        block: 'end'
      });
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

  useEffect(() => {
    if (!isClient) return;

    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClient]);

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

  useEffect(() => {
    if (!isClient || !selectedChannel || !user || !isMounted) return;

    if (messages[selectedChannel]?.length > 0) {
      console.log(`Using cached messages for channel: ${selectedChannel}`);
      setTimeout(scrollToBottom, 100);
      return;
    }

    setLoadingMessages(true);
    setMessageError(null);

    const fetchMessages = async () => {
      try {
        console.log(`Fetching messages for channel: ${selectedChannel}`);
        const chatMessages = await messagesAPI.getChatMessages(selectedChannel);

        if (!isMounted) return;

        const formattedMessages = chatMessages.map(msg => ({
          id: msg.message_id.toString(),
          sender: msg.user_id.toString(),
          text: msg.message_content,
          time: new Date(msg.created_at).toLocaleTimeString('en-US', { 
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

        console.error('Error fetching messages:', error);
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
    };

    fetchMessages();
  }, [selectedChannel, isClient, user, isMounted, messages, scrollToBottom]);

  useEffect(() => {
    if (!isClient) return;

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact, isClient]);

  useEffect(() => {
    if (!isClient || !selectedContact) return;

    setTimeout(() => {}, 300);
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
        status: 'offline', // Default value
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
      setLoadingMessages(true);
      setMessageError(null);
      messagesAPI.getChatMessages(selectedChannel)
        .then(chatMessages => {
          if (!isMounted) return;
          const formattedMessages = chatMessages.map(msg => ({
            id: msg.message_id.toString(),
            sender: msg.user_id.toString(),
            text: msg.message_content,
            time: new Date(msg.created_at).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: 'numeric', hour12: true 
            }),
            isOwn: msg.user_id.toString() === user?.user_id?.toString(),
            type: msg.message_type,
            isRead: msg.is_read
          }));
          setMessages(prev => ({...prev, [selectedChannel]: formattedMessages}));
          setLoadingMessages(false);
        })
        .catch(error => {
          if (!isMounted) return;
          setMessageError(error.message || 'Failed to load messages');
          setLoadingMessages(false);
        });
    }
  }, [selectedChannel, isMounted, user]);

  const tabButtons = (
    <div className="bg-white/10 dark:bg-gray-800/50 rounded-lg p-1 flex items-center">
      <button
        className={cn(
          "flex items-center justify-center space-x-2 py-2 px-3 rounded-md flex-1 text-sm font-medium transition-all duration-200",
          activeTab === 'chats'
            ? "bg-white dark:bg-gray-700 text-violet-900 dark:text-violet-400 shadow-sm"
            : "text-white/90 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-700/30"
        )}
        onClick={() => handleTabChange('chats')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>Chats</span>
      </button>
      <button
        className={cn(
          "flex items-center justify-center space-x-2 py-2 px-3 rounded-md flex-1 text-sm font-medium transition-all duration-200",
          activeTab === 'groups'
            ? "bg-white dark:bg-gray-700 text-violet-900 dark:text-violet-400 shadow-sm"
            : "text-white/90 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-700/30"
        )}
        onClick={() => handleTabChange('groups')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>Groups</span>
      </button>
      <button
        className={cn(
          "flex items-center justify-center space-x-2 py-2 px-3 rounded-md flex-1 text-sm font-medium transition-all duration-200",
          activeTab === 'contacts'
            ? "bg-white dark:bg-gray-700 text-violet-900 dark:text-violet-400 shadow-sm"
            : "text-white/90 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-700/30"
        )}
        onClick={() => handleTabChange('contacts')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Contacts</span>
      </button>
    </div>
  );

  const renderTabContent = useCallback(() => {
    return (
      <>
        <div className={`space-y-1 px-2 ${activeTab === 'chats' ? 'block' : 'hidden'}`}>
          {/* Chats tab content */}
          {loadingContacts ? (
            <div className="p-4 text-center text-white/80 dark:text-gray-400">
              Loading contacts...
            </div>
          ) : apiError ? (
            <div className="p-4 m-2 text-center bg-red-500/10 rounded-lg">
              <p className="text-red-300 dark:text-red-400 mb-2 text-sm font-medium">Failed to load contacts</p>
              <p className="text-xs text-white/80 dark:text-gray-400 mb-3">{apiError}</p>
              <button 
                onClick={() => {
                  setLoadingContacts(true);
                  setTimeout(() => window.location.reload(), 500);
                }}
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
              <button
                key={contact.contact_id}
                className={cn(
                  "w-full flex items-center p-3 rounded-lg transition-colors duration-200 mb-1",
                  selectedContact === contact.contact_id.toString() 
                    ? "bg-white/20 dark:bg-violet-900/30" 
                    : "hover:bg-white/10 dark:hover:bg-gray-800/50"
                )}
                onClick={() => handleContactSelect(contact.contact_id.toString())}
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center bg-blue-500",
                  )}>
                    <span className="text-base font-medium text-white">{getInitials(contact.contact_full_name)}</span>
                  </div>
                </div>
                <div className="ml-3 flex-1 flex flex-col items-start text-left overflow-hidden">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-white dark:text-white truncate">
                      {contact.contact_full_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full mt-1">
                    <span className="text-sm text-white/70 dark:text-gray-400 truncate max-w-[80%]">
                      {contact.contact_mobile_number}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      
        <div className={`space-y-1 px-2 ${activeTab === 'groups' ? 'block' : 'hidden'}`}>
          {/* Groups tab content */}
          {sampleGroups.map(group => (
            <button
              key={group.id}
              className={cn(
                "w-full flex items-center p-3 rounded-lg transition-colors duration-200 mb-1",
                selectedContact === group.id 
                  ? "bg-white/20 dark:bg-violet-900/30" 
                  : "hover:bg-white/10 dark:hover:bg-gray-800/50"
              )}
              onClick={() => handleContactSelect(group.id)}
            >
              <div className="relative flex-shrink-0">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500",
                )}>
                  <span className="text-base font-medium text-white">{getInitials(group.name)}</span>
                </div>
              </div>
              <div className="ml-3 flex-1 flex flex-col items-start text-left overflow-hidden">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-white dark:text-white truncate">
                    {group.name}
                  </span>
                  <span className="text-xs text-white/60 dark:text-gray-400 ml-1">
                    {group.lastMessageTime}
                  </span>
                </div>
                <div className="flex items-center justify-between w-full mt-1">
                  <span className="text-sm text-white/70 dark:text-gray-400 truncate max-w-[80%]">
                    {group.lastMessage}
                  </span>
                  {group.unread > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-violet-600/80 text-white">
                      {group.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      
        <div className={`space-y-1 px-2 ${activeTab === 'contacts' ? 'block' : 'hidden'}`}>
          {/* Contacts tab content */}
          {loadingContacts ? (
            <div className="p-4 text-center text-white/80 dark:text-gray-400">
              Loading contacts...
            </div>
          ) : apiError ? (
            <div className="p-4 m-2 text-center bg-red-500/10 rounded-lg">
              <p className="text-red-300 dark:text-red-400 mb-2 text-sm font-medium">Failed to load contacts</p>
              <p className="text-xs text-white/80 dark:text-gray-400 mb-3">{apiError}</p>
              <button 
                onClick={() => {
                  setLoadingContacts(true);
                  setTimeout(() => window.location.reload(), 500);
                }}
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
              <button
                key={contact.contact_id}
                className={cn(
                  "w-full flex items-center p-3 rounded-lg transition-colors duration-200 mb-1",
                  selectedContact === contact.contact_id.toString() 
                    ? "bg-white/20 dark:bg-violet-900/30" 
                    : "hover:bg-white/10 dark:hover:bg-gray-800/50"
                )}
                onClick={() => handleContactSelect(contact.contact_id.toString())}
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center bg-blue-500",
                  )}>
                    <span className="text-base  font-medium text-white">{getInitials(contact.contact_full_name)}</span>
                  </div>
                </div>
                <div className="ml-3 flex-1 flex flex-col items-start text-left overflow-hidden">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-white dark:text-white truncate">
                      {contact.contact_full_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full mt-1">
                    <span className="text-sm text-white/70 dark:text-gray-400 truncate max-w-[80%]">
                      {contact.contact_mobile_number}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </>
    );
  }, [activeTab, contacts, loadingContacts, apiError, selectedContact]);

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
      <aside
        className={cn(
          "bg-gradient-to-b from-violet-700 to-violet-900 dark:from-gray-800 dark:to-gray-900 flex flex-col border-r border-violet-600/50 dark:border-gray-800 shadow-lg z-30",
          "transition-all duration-300 ease-in-out",
          "fixed inset-0 md:inset-y-0 md:left-0 md:w-80 md:relative md:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ minHeight: '100%' }}
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
            <h1 className="text-lg font-bold text-yellow-300 dark:text-yellow-300 ml-2">
              LS<span className="text-white dark:text-white">Chat</span>
              <span className='text-purple-300 dark:text-purple-400'> Web</span>
            </h1>
          </div>
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center text-white hover:text-gray-200 dark:text-gray-500 dark:hover:text-gray-300"
            onClick={() => setIsMobileSidebarOpen(false)}
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

        <div className="px-3 py-2 mb-2">
          {tabButtons}
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </aside>

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-violet-900/20 backdrop-blur-sm md:hidden z-20"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      <main className="flex-1 flex flex-col h-full w-full">
        <header className="h-16 flex items-center justify-between px-4 border-b border-violet-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-violet-100 dark:hover:bg-gray-800 text-black"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {selectedContactDetails && (
              <div className="flex items-center">
                <div className="relative">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    getAvatarColor(selectedContactDetails.name)
                  )}>
                    <span className="text-sm font-medium">{getInitials(selectedContactDetails.name)}</span>
                  </div>
                  {selectedContactDetails.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="text-sm font-medium text-gray-900 dark:text-white">{selectedContactDetails.name}</h2>
                  <p className="text-xs text-black dark:text-gray-400">
                    {selectedContactDetails.status === 'online' ? 'Online' : `Last seen ${selectedContactDetails.lastSeen}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {selectedContactDetails && (
              <div className="hidden sm:flex items-center space-x-2 mr-2">
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-100 dark:hover:bg-gray-800 text-black dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-100 dark:hover:bg-gray-800 text-black dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 00-2 2v8a2 2 01-2 2z" />
                  </svg>
                </button>
              </div>
            )}

            <div className="relative border-l border-violet-100 dark:border-gray-800 pl-3" ref={userMenuRef}>
              <div className="flex items-center">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 hover:bg-violet-50 dark:hover:bg-gray-800/50 py-1.5 px-2 rounded-lg group"
                >
                  <div className="relative w-8 h-8 rounded-full bg-violet-500 text-white overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-medium select-none" style={{ lineHeight: 1 }}>
                        {user.firstName?.charAt(0).toUpperCase() || user.first_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white text-left group-hover:text-black dark:group-hover:text-violet-400 transition-colors">
                      {user.firstName || user.first_name}
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-black dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 z-50 border border-violet-100 dark:border-gray-700 animate-fade-in-up">
                    <div className="px-4 py-2 border-b border-violet-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName || user.first_name} {user.lastName || user.last_name}
                      </p>
                      <p className="text-xs text-black dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <a href="#" onClick={()=>{alert('')}} className="block px-4 py-2 text-sm text-black dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-gray-800">
                      Your Profile
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-black dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-gray-800">
                      Settings
                    </a>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-violet-100 dark:hover:bg-gray-800 border-t border-violet-100 dark:border-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {selectedContact ? (
            <div className="flex-1 flex flex-col bg-violet-50 dark:bg-gray-950 overflow-hidden">
              <div 
                className="flex-1 overflow-y-auto" 
                style={{ 
                  height: "calc(100% - 80px)", 
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div className="p-4 space-y-3 flex-1">
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1 bg-violet-100 dark:bg-gray-800 rounded-full">
                      <span className="text-xs text-black dark:text-gray-400">Today</span>
                    </div>
                  </div>

                  <div className="relative min-h-[200px]">
                    <MessageList 
                      messages={selectedChannel ? messages[selectedChannel] || [] : []}
                      contactName={selectedContactDetails?.name || ''}
                      isLoading={loadingMessages}
                      error={messageError}
                      onRetry={handleRetryLoadMessages}
                      endRef={messagesEndRef}
                    />
                  </div>
                </div>
              </div>

              <MessageInput 
                onSendMessage={handleSendMessage}
                disabled={!selectedChannel}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-violet-50 dark:bg-gray-950 p-4 text-center">
              <div className="w-20 h-20 bg-violet-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-violet-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-black dark:text-gray-200 mb-2">No conversation selected</h3>
              <p className="text-black dark:text-gray-400 max-w-sm">
                Select a conversation from the sidebar to start chatting, or create a new conversation with one of your contacts.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
