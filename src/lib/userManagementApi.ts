import { API_BASE_URL } from './api';

export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: number;
  can_announce: number;
  push_token: string | null;
  profile_picture: string | null;
  created_at: string;
  last_active: string | null;
}

export interface PaginationData {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  pagination: PaginationData;
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

export const userManagementAPI = {
  fetchUsers: async (page: number = 1, perPage: number = 10): Promise<UsersResponse> => {
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });

      const url = `${API_BASE_URL}/api/admin/users?page=${page}&perPage=${perPage}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
      }

      const data: UsersResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  toggleCanAnnounce: async (userId: string, currentValue: number): Promise<User> => {
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });

      const url = `${API_BASE_URL}/api/admin/users/update/can_announce/${userId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ can_announce: currentValue === 1 ? 0 : 1 }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update user permissions: ${response.status} - ${errorText}`);
      }

      const updatedUser: User = await response.json();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  },
  fetchGroups: async (page: number = 1, perPage: number = 10): Promise<{ success: boolean; groups: string[] }> => {
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });

      const url = `${API_BASE_URL}/api/admin/groups?page=${page}&limit=${perPage}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch groups: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  }
  
};


