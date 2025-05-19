import { API_BASE_URL } from './api';

export interface Group {
  group_id: number;
  name: string;
  description: string;
  pubnub_channel: string;
  role: string;
  created_at: string;
}

export interface GroupMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  created_at: string;
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

export const groupsAPI = {
  getGroups: async (userId: string | number): Promise<Group[]> => {
    if (!userId) {
      throw new Error('User ID is required to fetch groups');
    }
    
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });
      
      const url = `${API_BASE_URL}/api/fetch-groups?user_id=${userId}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch groups: ${response.status} - ${errorText}`);
      }
      
      const groups: Group[] = await response.json();
      
      return groups;
    } catch (error) {
      console.error('Group list fetch error:', error);
      throw error;
    }
  },

  getGroupMessages: async (groupId: number | string): Promise<GroupMessage[]> => {
    if (!groupId) {
      throw new Error('Group ID is required to fetch messages');
    }
    
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });
      
      const url = `${API_BASE_URL}/api/groupMessages/${groupId}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch group messages: ${response.status} - ${errorText}`);
      }
      
      const messages: GroupMessage[] = await response.json();
      
      return messages;
    } catch (error) {
      console.error('Group messages fetch error:', error);
      throw error;
    }
  },

  sendGroupMessage: async (groupId: number | string, userId: number | string, message: string): Promise<GroupMessage> => {
    if (!groupId) {
      throw new Error('Group ID is required to send a message');
    }

    if (!userId) {
      throw new Error('User ID is required to send a message');
    }
    
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });
      
      const body = JSON.stringify({
        user_id: userId,
        message: message,
      });
      
      const url = `${API_BASE_URL}/api/groupMessages/${groupId}`;
      const response = await fetch(url, { 
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send group message: ${response.status} - ${errorText}`);
      }
      
      const sentMessage: GroupMessage = await response.json();
      
      return sentMessage;
    } catch (error) {
      console.error('Send group message error:', error);
      throw error;
    }
  }
};
