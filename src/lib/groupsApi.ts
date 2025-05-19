import { API_BASE_URL } from './api';

export interface Group {
  group_id: number;
  name: string;
  description: string;
  pubnub_channel: string;
  role: string;
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
    
    console.log(`Attempting to fetch groups for user ID: ${userId}`);
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
      console.log(`Fetched ${groups.length} groups for user ${userId}`);
      
      return groups;
    } catch (error) {
      console.error('Group list fetch error:', error);
      throw error;
    }
  }
};
