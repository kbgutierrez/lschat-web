export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    user_id: string;
    username: string;
    first_name: string;
    middle_name: string;
    mobile_number: string;
    last_name: string;
    email: string;
    profile_picture?: string;
    is_admin?: number;
    can_announce?: number;
    permission_type?: string;
    is_logged_in?: number;
    last_logged_in?: string;
  };
  token?: string;
  firstName?: string;
  middleName?: string;
  mobileNumber?: string;
  lastName?: string;
  user_id?: string;
  username?: string;
  email?: string;
  profilePicture?: string;
  isAdmin?: number;
  canAnnounce?: number;
  permissionType?: string;
  isLoggedIn?: number;
  lastLoggedIn?: string;
}

export interface ContactListItem {
  user_id: number;
  contact_id: number;
  contact_full_name: string;
  contact_mobile_number: string;
  pubnub_channel: string;
  status: string;
  email: string;
  contact_picture: string;
  user_picture: string;
}

export interface ChatMessage {
  message_id: number;
  user_id: number;
  message_content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

const middleware = {
  addAuthHeader: (headers: HeadersInit = {}) => {
    if (typeof window === 'undefined') return headers;
    try {
      const session = localStorage.getItem('userSession');
      if (session) {
        const { token } = JSON.parse(session);
        if (token) {
          return { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    return headers;
  }
};

export async function fetchAPI<T = any>(
  endpoint: string, 
  options: RequestInit = {},
  useAuth = false
): Promise<T> {
  if (useAuth && typeof window === 'undefined') {
    throw new Error('Auth API calls cannot be made during server rendering');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(useAuth ? middleware.addAuthHeader(options.headers) : {})
  };
  
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (typeof window !== 'undefined') {
      // console.log(`${options.method || 'GET'} ${endpoint}: ${response.status} ${response.ok ? '✓' : '✗'}`);
    }
    
    if (!response.ok) {
      // console.log('response:', response);
      const errorMessage = data.message || data.error || 
        (response.status === 401 ? 'Invalid username or password' : 'Something went wrong');
      console.log(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error(`Error ${endpoint}:`, error);
    throw error;
  }
}

export const authAPI = {
  login: async (username: string, password: string, fcm_token?: string): Promise<LoginResponse> => {
    console.log('Login attempt for:', username, 'with FCM token:', fcm_token ? '✓ Provided' : '✗ Missing');
    
    const requestBody = fcm_token 
      ? { username, password, fcm_token } 
      : { username, password };
    
    const response = await fetchAPI<LoginResponse>('/api/userLogin', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    console.log('Login response processed:', {
      success: response.success,
      hasToken: !!response.token,
      user: response.user ? {
        id: response.user.user_id,
        username: response.user.username,
        name: `${response.user.first_name} ${response.user.last_name}`
      } : null
    });
    
    return response;
  },
  
  register: (userData: any): Promise<any> => {
    return fetchAPI('/api/userRegister', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
};

export const userAPI = {
  getProfile: (): Promise<any> => {
    return fetchAPI('/api/userProfile', {}, true);  },
  
  updateProfile: (profileData: any): Promise<any> => {
    return fetchAPI('/api/userProfile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    }, true);
  }
};

export const contactsAPI = {
  getContactList: async (userId: string | number): Promise<ContactListItem[]> => {
    if (!userId) {
      throw new Error('User ID is required to fetch contacts');
    }
    
    // console.log(`Attempting to fetch contacts for user ID: ${userId}`);
    try {
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetchAPI<ContactListItem[]>(`/api/fetch-contact-lists/?user_id=${userId}`, {}, true);
      
     
      const filteredContacts = response.filter(contact => contact.contact_id !== Number(userId));
      // console.log('Filtered contacts:', filteredContacts);
      // console.log('pubnub_channel:', filteredContacts.map(contact => contact.pubnub_channel));
      // console.log('Fetched contacts:', filteredContacts.length);
      return filteredContacts;
    } catch (error) {
      console.error('Contact list fetch error:', error);
    
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to the server. Please check your connection and try again.');
      }
   
      throw error;
    }
  },
  
  fetchIncomingRequests: async (userId: string | number): Promise<any[]> => {
    if (!userId) {
      throw new Error('User ID is required to fetch friend requests');
    }
    
    try {
      const headers = middleware?.addAuthHeader ? 
        middleware.addAuthHeader({
          'Content-Type': 'application/json',
        }) : 
        { 'Content-Type': 'application/json' };
      
      const response = await fetch(`${API_BASE_URL}/api/fetch-friend-requests?contact_id=${userId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch friend requests: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Friend requests fetch error:', error);
      throw error;
    }
  },
  
  updateContactRequest: async (
    userId: string | number,
    requesterId: string | number,
    status: 'accept' | 'reject',
    updatedAt?: string
  ): Promise<any> => {
    try {
      const url = `${API_BASE_URL}/api/update-contact-list`;
      
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json'
      });
      
      const response = await fetch(url, {
        method: 'PUT', 
        headers,
        body: JSON.stringify({
          user_id: userId,
          requester_id: requesterId,
          status: status,
          updated_at: updatedAt || new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${status} contact request: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating contact request:`, error);
      throw error;
    }
  }
};

import { publishMessage, formatMessageForPubNub } from './pubnub';

const messageCache: Record<string, {
  data: ChatMessage[],
  timestamp: number,
  messageIds: Set<number | string>
}> = {};

const MESSAGE_CACHE_TTL = 5000;

export const messagesAPI = {
  getChatMessages: async (channelToken: string): Promise<ChatMessage[]> => {
    if (!channelToken) {
      throw new Error('Channel token is required to fetch messages');
    }
    
    const now = Date.now();
    const cachedData = messageCache[channelToken];
    
    if (cachedData && now - cachedData.timestamp < MESSAGE_CACHE_TTL) {
      return cachedData.data;
    }
    
   
    try {
      const response = await fetchAPI<ChatMessage[]>(`/api/chatMessages/${channelToken}`, {}, true);
    console.log(`response`, response);
      let hasNewMessages = true;
      if (cachedData) {
        const newMessageIds = new Set(response.map(msg => msg.message_id));
        hasNewMessages = newMessageIds.size !== cachedData.messageIds.size ||
          response.some(msg => !cachedData.messageIds.has(msg.message_id));
      }
      
      if (hasNewMessages) {
        // console.log(`💬 New messages detected in channel ${channelToken}`);
      }
      
      messageCache[channelToken] = {
        data: response,
        timestamp: now,
        messageIds: new Set(response.map(msg => msg.message_id))
      };
      
      return response;
    } catch (error) {
      console.error('Chat messages fetch error:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to the message server. Please check your connection and try again.');
      }
      
      throw error;
    }
  },
  
  invalidateCache: (channelToken: string): void => {
    if (channelToken && messageCache[channelToken]) {
      delete messageCache[channelToken];
      console.log(`Cache invalidated for channel ${channelToken}`);
    }
  },
  
  sendMessage: async (channelToken: string, content: string, file?: File): Promise<ChatMessage> => {
    if (!channelToken) {
      throw new Error('Channel token is required to send a message');
    }
    
    try {
      const userData = typeof window !== 'undefined' ? 
        JSON.parse(localStorage.getItem('userSession') || '{}').user : null;
      
      const userId = userData?.user_id || 'unknown';
      
      const formData = new FormData();
      formData.append('user_id', userId.toString());
      formData.append('message_content', content);
      formData.append('token', channelToken);
      
      if (file) {
        formData.append('file', file);
      }
      
      const headers: HeadersInit = middleware.addAuthHeader({});
      
      const url = `${API_BASE_URL}/api/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const data = await response.json();
      
      try {
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        await publishMessage(
          channelToken, 
          {
            type: 'NEW_MESSAGE',
            action: 'new_message',
            sender: userId,
            timestamp: Date.now(),
            notification_id: uniqueId
          },
          userId.toString()
        );
        
        messagesAPI.invalidateCache(channelToken);
        
      } catch (pubnubError) {
        console.error('Failed to send PubNub notification:', pubnubError);
      }
      
      return {
        message_id: data.messageId,
        user_id: parseInt(userId),
        message_content: content,
        message_type: file ? 'file' : 'text',
        created_at: new Date().toISOString(),
        is_read: false
      };
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }
};

