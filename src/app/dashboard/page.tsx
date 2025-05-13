'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
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
  const colors = [
    'bg-blue-500 text-white',
    'bg-green-500 text-white',
    'bg-yellow-500 text-white',
    'bg-purple-500 text-white',
    'bg-pink-500 text-white',
    'bg-indigo-500 text-white',
    'bg-red-500 text-white',
    'bg-teal-500 text-white'
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};


type TabType = 'chats' | 'groups' | 'contacts';

export default function Dashboard() {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState<string | null>('1');
  const [selectedContactDetails, setSelectedContactDetails] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chats');


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
  };


  if (checkingAuth) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900"></div>;
  }
  
  return user ? (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/images/lschat-logo.png" 
              alt="LS Chat Logo"
              width={36}
              height={36}
              className="mr-3"
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">LS Chat</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold">
                {user.firstName || user.first_name} {user.lastName || user.last_name}
              </span>
            </div>
            
            <Button 
              variant="secondary"
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Log out
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content - Messaging Interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with tabs */}
        <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('chats')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === 'chats' 
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === 'groups' 
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Groups
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === 'contacts' 
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Contacts
            </button>
          </div>
          
          {/* Search bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input 
                type="text" 
                placeholder={
                  activeTab === 'chats' 
                    ? "Search conversations..." 
                    : activeTab === 'groups' 
                      ? "Search groups..." 
                      : "Search contacts..."
                }
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {activeTab === 'chats' && (
              <div className="p-2">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 my-2">
                  Recent Chats
                </h2>

                {sampleContacts.map(contact => (
                  <button
                    key={contact.id}
                    className={cn(
                      "w-full flex items-center px-3 py-2 rounded-lg mb-1 transition-colors",
                      selectedContact === contact.id 
                        ? "bg-blue-50 dark:bg-blue-900/30" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/30"
                    )}
                    onClick={() => handleContactSelect(contact.id)}
                  >
                    <div className="relative">
                      <div className={cn(
                        "relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center",
                        getAvatarColor(contact.name)
                      )}>
                        <span className="text-sm font-medium">
                          {getInitials(contact.name)}
                        </span>
                      </div>
                      
                      {contact.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 overflow-hidden text-left">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white truncate">{contact.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{contact.lastSeen}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {sampleMessages[contact.id]?.[sampleMessages[contact.id].length - 1]?.text || "No messages"}
                        </span>
                        
                        {contact.unread > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {contact.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="p-2">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 my-2">
                  Your Groups
                </h2>

                {sampleGroups.map(group => (
                  <button
                    key={group.id}
                    className={cn(
                      "w-full flex items-center px-3 py-2 rounded-lg mb-1 transition-colors",
                      selectedContact === group.id 
                        ? "bg-blue-50 dark:bg-blue-900/30" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/30"
                    )}
                    onClick={() => handleContactSelect(group.id)}
                  >
                    <div className="relative">
                      <div className={cn(
                        "relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center",
                        getAvatarColor(group.name)
                      )}>
                        <span className="text-sm font-medium">
                          {getInitials(group.name)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-3 flex-1 overflow-hidden text-left">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white truncate">{group.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{group.lastMessageTime}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {group.lastMessage}
                        </span>
                        
                        {group.unread > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {group.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                <div className="mt-4 px-2">
                  <button className="w-full py-2 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Group
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="p-2">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 my-2">
                  All Contacts
                </h2>

                {sampleContacts.map(contact => (
                  <button
                    key={contact.id}
                    className={cn(
                      "w-full flex items-center px-3 py-2 rounded-lg mb-1 transition-colors",
                      selectedContact === contact.id 
                        ? "bg-blue-50 dark:bg-blue-900/30" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/30"
                    )}
                    onClick={() => handleContactSelect(contact.id)}
                  >
                    <div className="relative">
                      <div className={cn(
                        "relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center",
                        getAvatarColor(contact.name)
                      )}>
                        <span className="text-sm font-medium">
                          {getInitials(contact.name)}
                        </span>
                      </div>
                      
                      {contact.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 overflow-hidden text-left">
                      <span className="font-medium text-gray-900 dark:text-white truncate">{contact.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {contact.status === 'online' ? 'Online' : `Last seen ${contact.lastSeen}`}
                      </p>
                    </div>
                  </button>
                ))}

                <div className="mt-4 px-2">
                  <button className="w-full py-2 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Contact
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
          {selectedContact ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <div className="flex items-center">
                  <div className="relative">
                    <div className={cn(
                      "relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center",
                      selectedContactDetails ? getAvatarColor(selectedContactDetails.name) : "bg-gray-300 dark:bg-gray-700"
                    )}>
                      {selectedContactDetails && (
                        <span className="text-sm font-medium">
                          {getInitials(selectedContactDetails.name)}
                        </span>
                      )}
                    </div>
                    {selectedContactDetails?.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900 dark:text-white">{selectedContactDetails?.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedContactDetails?.status === 'online' ? 'Online' : `Last seen ${selectedContactDetails?.lastSeen}`}
                    </div>
                  </div>
                </div>
                
                <div className="ml-auto flex items-center space-x-2">
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sampleMessages[selectedContact]?.map(message => (
                  <div 
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={cn(
                        "max-w-[80%] px-4 py-2 rounded-lg",
                        message.isOwn 
                          ? "bg-blue-500 text-white rounded-br-none" 
                          : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none shadow-sm"
                      )}
                    >
                      <p>{message.text}</p>
                      <div 
                        className={cn(
                          "text-xs mt-1",
                          message.isOwn 
                            ? "text-blue-100" 
                            : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {message.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 ml-3 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button className="ml-3 p-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a conversation</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose a contact to start chatting</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right sidebar - Contact details */}
        <div className="w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 hidden lg:block">
          {selectedContactDetails ? (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={cn(
                  "relative mx-auto w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mb-4",
                  getAvatarColor(selectedContactDetails.name)
                )}>
                  <span className="text-3xl font-medium">
                    {getInitials(selectedContactDetails.name)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedContactDetails.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedContactDetails.status === 'online' ? 'Online' : `Last seen ${selectedContactDetails.lastSeen}`}
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Contact Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                        {selectedContactDetails.name.toLowerCase().replace(' ', '.')}@example.com
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">+63 919 123 4567</span>
                    </div>
                  </div>
                </div>
                
              
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Select a contact to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;
}
