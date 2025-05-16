export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  token?: string;
  firstName?: string;
  lastName?: string;
  user_id?: string;
  username?: string;
  email?: string;
}

export interface ContactListItem {
  user_id: number;
  contact_id: number;
  contact_full_name: string;
  contact_mobile_number: string;
  pubnub_channel: string;
  status: string;
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
      console.log(`${options.method || 'GET'} ${endpoint}: ${response.status} ${response.ok ? '✓' : '✗'}`);
    }
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
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

// User-related API calls
export const userAPI = {
  getProfile: (): Promise<any> => {
    return fetchAPI('/api/userProfile', {}, true); // true enables auth header
  },
  
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
    
    console.log(`Attempting to fetch contacts for user ID: ${userId}`);
    try {
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetchAPI<ContactListItem[]>(`/api/fetch-contact-lists/?user_id=${userId}`, {}, true);
      
     
      const filteredContacts = response.filter(contact => contact.contact_id !== Number(userId));
      console.log('Filtered contacts:', filteredContacts);
      console.log('pubnub_channel:', filteredContacts.map(contact => contact.pubnub_channel));
      console.log('Fetched contacts:', filteredContacts.length);
      return filteredContacts;
    } catch (error) {
      console.error('Contact list fetch error:', error);
    
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to the server. Please check your connection and try again.');
      }
   
      throw error;
    }
  }
};

import { publishMessage, formatMessageForPubNub } from './pubnub';

// Add a simple in-memory cache for chat messages
const messageCache: Record<string, {data: ChatMessage[], timestamp: number}> = {};
const MESSAGE_CACHE_TTL = 30000; // 30 seconds cache TTL

export const messagesAPI = {
  getChatMessages: async (channelToken: string): Promise<ChatMessage[]> => {
    if (!channelToken) {
      throw new Error('Channel token is required to fetch messages');
    }
    
    // Check if we have a valid cache
    const now = Date.now();
    const cachedData = messageCache[channelToken];
    if (cachedData && now - cachedData.timestamp < MESSAGE_CACHE_TTL) {
      console.log(`Using cached messages for channel ${channelToken}`);
      return cachedData.data;
    }
    
    console.log(`Fetching chat messages for channel: ${channelToken}`);
    
    try {
      const response = await fetchAPI<ChatMessage[]>(`/api/chatMessages/${channelToken}`, {}, true);
      console.log(`Retrieved ${response.length} messages from channel ${channelToken}`);
      
      // Cache the result for future calls
      messageCache[channelToken] = {
        data: response,
        timestamp: now
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
  
  sendMessage: async (channelToken: string, content: string, file?: File): Promise<ChatMessage> => {
    if (!channelToken) {
      throw new Error('Channel token is required to send a message');
    }
    
    try {
      const userData = typeof window !== 'undefined' ? 
        JSON.parse(localStorage.getItem('userSession') || '{}').user : null;
      
      const userId = userData?.user_id || 'unknown';
      
      // Create FormData for multipart/form-data request (required for file uploads)
      const formData = new FormData();
      formData.append('user_id', userId.toString());
      formData.append('message_content', content);
      formData.append('token', channelToken);
      
      // Add file if it exists
      if (file) {
        formData.append('file', file);
      }
      
      // Prepare headers - don't set Content-Type as it will be automatically set with boundary
      const headers: HeadersInit = middleware.addAuthHeader({});
      
      // Send request to backend
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
      
      // After successful API call, publish to PubNub to notify other clients
      try {
        // Send a small notification message - enough to trigger refresh
        await publishMessage(
          channelToken, 
          {
            action: 'new_message',
            sender: userId,
            timestamp: new Date().toISOString()
          },
          userId.toString()
        );
      } catch (pubnubError) {
        // Just log the error - API already succeeded
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

