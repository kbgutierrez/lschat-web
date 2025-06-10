import { API_BASE_URL } from './api';

// Types for announcement permissions response
export interface AnnouncementParticipant {
  id: string;
  name: string;
  type: 'user' | 'group';
  image?: string;
}

export interface AnnouncementPermissionsResponse {
  success: boolean;
  userId: number;
  permissionType: 'everyone' | 'byGroup' | 'byUser';
  groups: Array<{
    group_id: number;
    name: string;
    description?: string;
  }>;
  users: Array<{
    user_id: number;
    name: string;
    email?: string;
    profile_picture?: string;
  }>;
}

// Add auth header middleware
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

export const announcementsAPI = {
  // Fetch announcement permissions for the current user
  fetchAnnouncementPermissions: async (userId: string | number): Promise<AnnouncementPermissionsResponse> => {
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`${API_BASE_URL}/api/fetch/announcement-permissions/${userId}`, {
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch announcement permissions: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching announcement permissions:', error);
      throw error;
    }
  },
  
  // Create a new announcement
  createAnnouncement: async (data: {
    title: string,
    content: string,
    type: string,
    recipients: string[],
    image?: File,
    imageCaption?: string
  }): Promise<any> => {
    try {
      const headers = middleware.addAuthHeader();
      
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('type', data.type);
      
      // Add recipients
      data.recipients.forEach(recipient => {
        formData.append('recipients[]', recipient);
      });
      
      // Add image if present
      if (data.image) {
        formData.append('image', data.image);
      }
      
      // Add image caption if present
      if (data.imageCaption) {
        formData.append('image_caption', data.imageCaption);
      }

      const response = await fetch(`${API_BASE_URL}/api/announcements/create`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create announcement: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }
};

