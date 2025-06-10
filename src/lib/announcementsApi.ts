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
          if (id.startsWith('group_')) return Number(id.substring(6));
          if (id.startsWith('user_')) return Number(id.substring(5));
          return Number(id);
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
  }
};

