'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Sample data
const sampleContacts = [
  {
    id: '1',
    name: 'Juan Dela Cruz',
    status: 'online',
    lastSeen: 'Just now',
    unread: 0
  },
  {
    id: '2',
    name: 'Tanggol Di Magiba',
    status: 'offline',
    lastSeen: '1 hour ago',
    unread: 3
  },
  {
    id: '3',
    name: 'Maria Santos',
    status: 'online',
    lastSeen: 'Just now',
    unread: 0
  },
  {
    id: '4',
    name: 'Roberto Magtanggol',
    status: 'offline',
    lastSeen: '3 hours ago',
    unread: 0
  }
];

// Define message type
type Message = {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
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
  // Return fixed color for all contacts and groups
  return 'bg-blue-500 text-white';
};

type TabType = 'chats' | 'groups' | 'contacts';

export default function Dashboard() {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState<string | null>('2');
  const [selectedContactDetails, setSelectedContactDetails] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const initialUser = (() => {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = localStorage.getItem('userSession');
      if (!sessionData) return null;

      const userData = JSON.parse(sessionData);

      if (userData.user) {
        return userData.user;
      } else if (userData.first_name || userData.user_id) {
        return {
          id: userData.user_id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          email: userData.email
        };
      }
      return null;
    } catch {
      return null;
    }
  })();

  const [user, setUser] = useState(initialUser);
  const [checkingAuth, setCheckingAuth] = useState(!initialUser);

  useEffect(() => {
    if (user) {
      return;
    }

    const authCheck = async () => {
      try {
        const sessionData = localStorage.getItem('userSession');
        if (!sessionData) {
          router.push('/auth');
          return;
        }

        const userData = JSON.parse(sessionData);

        if (userData.user) {
          setUser(userData.user);
        } else if (userData.first_name || userData.user_id) {
          setUser({
            id: userData.user_id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            username: userData.username,
            email: userData.email
          });
        } else {
          console.error('Invalid user data format', userData);
          router.push('/auth');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth');
      } finally {
        setCheckingAuth(false);
      }
    };

    authCheck();
  }, [router, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedContact) {
      setTimeout(() => messageInputRef.current?.focus(), 300);
    }
  }, [selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      const contactDetails = sampleContacts.find(contact => contact.id === selectedContact);
      setSelectedContactDetails(contactDetails);
    }
  }, [selectedContact]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('userSession');
      router.push('/auth');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleContactSelect = (id: string) => {
    setSelectedContact(id);
    const contactDetails = sampleContacts.find(contact => contact.id === id);
    setSelectedContactDetails(contactDetails);
    setIsMobileSidebarOpen(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const newMsg = {
      id: `m${Date.now()}`,
      sender: 'me',
      text: newMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
      isOwn: true
    };

    if (!sampleMessages[selectedContact]) {
      sampleMessages[selectedContact] = [];
    }

    sampleMessages[selectedContact].push(newMsg);

    setNewMessage('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (checkingAuth) {
    return <div className="min-h-screen bg-white dark:bg-gray-950"></div>;
  }

  const formatMessageTime = (timeString: string) => {
    return timeString;
  };

  return user ? (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <aside
        className={cn(
          "bg-white dark:bg-gray-900 flex flex-col border-r border-gray-100 dark:border-gray-800 z-30",
          "transition-all duration-300 ease-in-out",
          "fixed inset-0 md:inset-y-0 md:left-0 md:w-80 md:relative md:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center ">
            <div className="w-10 h-10 relative">
              <Image
                src="/images/logo-no-label.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-yellow-300">
              LS<span className="dark:text-white">Chat</span>
              <span className='dark:text-purple-400'> Web</span>
            </h1>
          </div>
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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
              className="w-full h-10 pl-10 pr-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <div className="px-3 py-2 mb-2">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex items-center">
            <button
              className={cn(
                "flex items-center justify-center space-x-2 py-2 px-3 rounded-full flex-1 text-sm font-medium transition-all duration-200",
                activeTab === 'chats'
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
              onClick={() => setActiveTab('chats')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Chats</span>
            </button>
            <button
              className={cn(
                "flex items-center justify-center space-x-2 py-2 px-3 rounded-full flex-1 text-sm font-medium transition-all duration-200",
                activeTab === 'groups'
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
              onClick={() => setActiveTab('groups')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Groups</span>
            </button>
            <button
              className={cn(
                "flex items-center justify-center space-x-2 py-2 px-3 rounded-full flex-1 text-sm font-medium transition-all duration-200",
                activeTab === 'contacts'
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
              onClick={() => setActiveTab('contacts')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Contacts</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sampleContacts.map(contact => (
                <button
                  key={contact.id}
                  className={cn(
                    "w-full flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                    selectedContact === contact.id && "bg-indigo-50 dark:bg-indigo-900/10"
                  )}
                  onClick={() => handleContactSelect(contact.id)}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      getAvatarColor(contact.name)
                    )}>
                      <span className="text-base font-medium">{getInitials(contact.name)}</span>
                    </div>
                    {contact.status === 'online' && (
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                    )}
                  </div>
                  <div className="ml-4 flex-1 flex flex-col items-start text-left overflow-hidden">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {contact.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        {contact.lastSeen === 'Just now' ? 'Now' : contact.lastSeen}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[80%]">
                        {sampleMessages[contact.id]?.[sampleMessages[contact.id].length - 1]?.text || "No messages"}
                      </span>
                      {contact.unread > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-indigo-600 text-white">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sampleGroups.map(group => (
                <button
                  key={group.id}
                  className={cn(
                    "w-full flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                    selectedContact === group.id && "bg-indigo-50 dark:bg-indigo-900/10"
                  )}
                  onClick={() => handleContactSelect(group.id)}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      getAvatarColor(group.name)
                    )}>
                      <span className="text-base font-medium">{getInitials(group.name)}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-1 flex flex-col items-start text-left overflow-hidden">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {group.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        {group.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[80%]">
                        {group.lastMessage}
                      </span>
                      {group.unread > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-indigo-600 text-white">
                          {group.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sampleContacts.map(contact => (
                <button
                  key={contact.id}
                  className={cn(
                    "w-full flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                    selectedContact === contact.id && "bg-indigo-50 dark:bg-indigo-900/10"
                  )}
                  onClick={() => handleContactSelect(contact.id)}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      getAvatarColor(contact.name)
                    )}>
                      <span className="text-base font-medium">{getInitials(contact.name)}</span>
                    </div>
                    {contact.status === 'online' && (
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-start text-left">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {contact.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {contact.status === 'online' ? 'Online' : contact.lastSeen}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-20"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      <main className="flex-1 flex flex-col h-full w-full">
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedContactDetails.status === 'online' ? 'Online' : `Last seen ${selectedContactDetails.lastSeen}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {selectedContactDetails && (
              <div className="hidden sm:flex items-center space-x-2 mr-2">
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            )}

            <div className="relative border-l border-gray-100 dark:border-gray-800 pl-3" ref={userMenuRef}>
              <div className="flex items-center">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 py-1.5 px-2 rounded-lg group"
                >
                  <div className="relative w-8 h-8 rounded-full bg-blue-500 text-white overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-medium select-none" style={{ lineHeight: 1 }}>
                        {user.firstName ? user.firstName.charAt(0) : user.first_name?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white text-left group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {user.firstName || user.first_name}
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 z-50 border border-gray-100 dark:border-gray-700 animate-fade-in-up">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName || user.first_name} {user.lastName || user.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <a href="#" onClick={()=>{alert('')}} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Your Profile
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Settings
                    </a>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {selectedContact ? (
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex justify-center my-4">
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
                </div>
              </div>

              {sampleMessages[selectedContact]?.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.isOwn && (
                    <div className="flex-shrink-0 mr-3">
                      {(index === 0 ||
                        sampleMessages[selectedContact][index - 1].isOwn ||
                        (index > 0 && !sampleMessages[selectedContact][index - 1].isOwn &&
                          parseInt(message.time) - parseInt(sampleMessages[selectedContact][index - 1].time) > 300000)) && (
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          getAvatarColor(selectedContactDetails?.name || "")
                        )}>
                          <span className="text-xs font-medium">{getInitials(selectedContactDetails?.name || "")}</span>
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
                        ? "bg-indigo-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700",
                      message.isOwn ? "rounded-tr-none" : "rounded-tl-none"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 px-1">
                      {formatMessageTime(message.time)}
                      {message.isOwn && (
                        <span className="ml-1 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message"
                    className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 rounded-full border-0 focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={cn(
                    "p-3 rounded-full text-white",
                    newMessage.trim()
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 text-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No conversation selected</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Select a conversation from the sidebar to start chatting, or create a new conversation with one of your contacts.
            </p>
          </div>
        )}
      </main>
    </div>
  ) : null;
}
