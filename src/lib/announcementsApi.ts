import { API_BASE_URL } from './api';

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

// Type definitions for the announcement response
export interface Announcement {
  announcement_id: number;
  title: string;
  announcement_type: 'basic' | 'image';
  content: string | null;
  main_image_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_mime_type: string | null;
  permission_type: string;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
  is_active: boolean;
  creator_name: string;
  profile_picture: string | null;
  is_read?: number; // Add is_read field (0 for unread, 1 for read)
}

export interface IncomingAnnouncementsResponse {
  success: boolean;
  userId: string;
  announcements: Announcement[];
}

export interface UnreadAnnouncementsCountResponse {
  success: boolean;
  userId: number;
  unreadCount: number;
}

export interface MarkAnnouncementReadResponse {
  success: boolean;
  userId: number;
  announcementId: number;
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

export const announcementsAPI = {
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
  
  fetchIncomingAnnouncements: async (userId: string | number): Promise<IncomingAnnouncementsResponse> => {
    console.log(`fetchIncomingAnnouncements called for user ${userId}`);
    
    try {
      const headers = middleware.addAuthHeader();
      console.log('Request headers:', headers);
      
      const url = `${API_BASE_URL}/api/fetch/announcements-received/${userId}`;
      console.log(`Making request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });
      
      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        throw new Error(`Failed to fetch announcements: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Announcements data received:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchIncomingAnnouncements:', error);
      throw error;
    }
  },
  
  fetchPublishedAnnouncements: async (userId: string | number): Promise<IncomingAnnouncementsResponse> => {
    console.log(`fetchPublishedAnnouncements called for user ${userId}`);
    
    try {
      const headers = middleware.addAuthHeader();
      console.log('Request headers:', headers);
      
      const url = `${API_BASE_URL}/api/fetch/announcements-created/${userId}`;
      console.log(`Making request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });
      
      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        throw new Error(`Failed to fetch published announcements: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Published announcements data received:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchPublishedAnnouncements:', error);
      throw error;
    }
  },
  
  createAnnouncement: async (data: {
    title: string,
    content: string,
    type: string,
    recipients: string[],
    image?: File,
    imageCaption?: string,
    attachment?: File
  }): Promise<any> => {
    try {
      const user = typeof window !== 'undefined' ? localStorage.getItem('userSession') : null;
      if (!user) {
        throw new Error('User session not found');
      }
      
      const userData = JSON.parse(user);
      const userId = userData.user.user_id;
      
      if (!userId) {
        throw new Error('User ID not found in session');
      }
      
      const headers = middleware.addAuthHeader();
      
      const formData = new FormData();
      formData.append('title', data.title);
      
      formData.append('announcement_type', data.type === 'image' ? 'image' : 'basic');
      
      if (data.type === 'image') {
        if (data.image) {
          formData.append('main_image', data.image);
        }
        if (data.imageCaption) {
          formData.append('caption', data.imageCaption);
        }
        if (data.attachment) {
          formData.append('attachment', data.attachment);
          formData.append('attachment_name', data.attachment.name);
          formData.append('attachment_mime_type', data.attachment.type);
        }
      } else {
        formData.append('content', data.content);
      }
      
      formData.append('created_by_user_id', userId.toString());
      
      let permissionType = 'everyone';
      let audienceIds: number[] = []; // Changed to number[] from string[]
      
      if (data.recipients.length === 1 && data.recipients[0] === 'everyone') {
        permissionType = 'everyone';
      } else {
        const hasGroups = data.recipients.some(id => id.startsWith('group_'));
        permissionType = hasGroups ? 'byGroup' : 'byUser';
        
        audienceIds = data.recipients.map(id => {
          if (id.startsWith('group_')) {
            return parseInt(id.replace('group_', ''));
          }
          if (id.startsWith('user_')) {
            return parseInt(id.replace('user_', ''));
          }
          return parseInt(id);
        });
      }
      
      formData.append('permission_type', permissionType);
      
      if (audienceIds.length > 0) {
        formData.append('audience_ids', JSON.stringify(audienceIds));
      }

      console.log('Sending announcement with:');
      console.log('- Title:', data.title);
      console.log('- Type:', data.type);
      console.log('- Permission Type:', permissionType);
      console.log('- User ID:', userId);
      console.log('- Audience IDs (as numbers):', audienceIds);
      if (data.attachment) {
        console.log('- Attachment:', data.attachment.name, data.attachment.type);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/create/announcement`, {
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
  },

  fetchUnreadAnnouncementsCount: async (userId: string | number): Promise<UnreadAnnouncementsCountResponse> => {
    try {
      const headers = middleware.addAuthHeader();
      
      const response = await fetch(`${API_BASE_URL}/api/fetch/unread-announcements-count/${userId}`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch unread announcements count: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unread announcements count:', error);
      throw error;
    }
  },

  markAnnouncementRead: async (userId: string | number, announcementId: number): Promise<MarkAnnouncementReadResponse> => {
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });
      
      const response = await fetch(`${API_BASE_URL}/api/update/mark-announcement-read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, announcementId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark announcement as read: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      throw error;
    }
  },

  updateAnnouncementStatus: async (
    announcementId: number,
    isActive: number,
    userId: string | number
  ) => {
    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });
      
      const response = await fetch(`${API_BASE_URL}/api/update/announcement-status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          announcement_id: announcementId,
          is_active: isActive,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update announcement status');
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error updating announcement status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
};

