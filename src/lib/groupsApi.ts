import { API_BASE_URL } from './api';
import { publishMessage } from './pubnub';

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
  profile_picture?: string;
}

export interface GroupMember {
  user_id: number;
  name: string;
  profile_picture?: string;
  role: string;
}

export interface leaveGroup {
  group_id: number;
  user_id: number;
}

export interface NonGroupMember {
  user_id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  profile_picture: string | null;
}

export interface GroupInvitation {
  group_id : number;
  group_name: string;
  description: string;
  role: string;
  inviter_name: string;
  inviter_profile_picture?: string;
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
      console.log('Fetched groups pubnub channel:', groups.map(group => group.pubnub_channel));
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

  sendGroupMessage: async (groupId: number | string, userId: number | string, message: string, file?: File): Promise<GroupMessage> => {
    if (!groupId) {
      throw new Error('Group ID is required to send a message');
    }

    if (!userId) {
      throw new Error('User ID is required to send a message');
    }

    try {
      const headers = middleware.addAuthHeader();

      // If there's a file, use FormData instead of JSON
      if (file) {
        const formData = new FormData();
        formData.append('group_id', groupId.toString());
        formData.append('sender_id', userId.toString());
        formData.append('message_content', message);
        formData.append('message_type', 'text');
        formData.append('file', file);

        const url = `${API_BASE_URL}/api/sendGroupMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers,  // Browser will set content-type for FormData
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send group message: ${response.status} - ${errorText}`);
        }

        const sentMessage: GroupMessage = await response.json();

        // Try to send a PubNub notification
        try {
          const groupDetails = await groupsAPI.getGroups(userId);
          const thisGroup = groupDetails.find(g => g.group_id.toString() === groupId.toString());

          if (thisGroup && thisGroup.pubnub_channel) {
            console.log('🔔 Sending PubNub notification for group file message on channel:', thisGroup.pubnub_channel);
            const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            await publishMessage(
              thisGroup.pubnub_channel,
              {
                type: 'NEW_MESSAGE',
                action: 'new_message',
                group_id: groupId,
                sender: userId,
                timestamp: Date.now(),
                notification_id: uniqueId
              },
              userId.toString()
            );
          } else {
            console.log('⚠️ No PubNub channel found for group:', groupId);
          }
        } catch (pubnubError) {
          console.error('Failed to send PubNub notification for group message:', pubnubError);
        }

        return sentMessage;
      } else {
        // Text-only message
        const body = JSON.stringify({
          group_id: groupId,
          sender_id: userId,
          message_content: message,
          message_type: 'text'
        });

        const url = `${API_BASE_URL}/api/sendGroupMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send group message: ${response.status} - ${errorText}`);
        }

        const sentMessage: GroupMessage = await response.json();

        // Try to send a PubNub notification
        try {
          const groupDetails = await groupsAPI.getGroups(userId);
          const thisGroup = groupDetails.find(g => g.group_id.toString() === groupId.toString());

          if (thisGroup && thisGroup.pubnub_channel) {
            console.log('🔔 Sending PubNub notification for group text message on channel:', thisGroup.pubnub_channel);
            const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            // Add more detailed debugging
            console.log('Publishing notification with data:', {
              group_id: String(groupId),
              channel: thisGroup.pubnub_channel,
              uniqueId: uniqueId
            });

            await publishMessage(
              thisGroup.pubnub_channel,
              {
                type: 'NEW_MESSAGE',
                action: 'new_message',
                _isGroupMessage: true,  // Add explicit marker
                group_id: String(groupId), // Always ensure group_id is a string
                sender: userId,
                timestamp: Date.now(),
                notification_id: uniqueId
              },
              userId.toString()
            );
            console.log('✅ PubNub notification sent successfully');
          } else {
            console.log('⚠️ No PubNub channel found for group:', groupId, 'Group details:', thisGroup);
          }
        } catch (pubnubError) {
          console.error('Failed to send PubNub notification for group message:', pubnubError);
        }

        return sentMessage;
      }
    } catch (error) {
      console.error('Send group message error:', error);
      throw error;
    }
  },

  getGroupMembers: async (groupId: number | string): Promise<{ user_id: number; name: string; profile_picture?: string; role: string }[]> => {
    if (!groupId) {
      throw new Error('Group ID is required to fetch members');
    }

    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });

      const url = `${API_BASE_URL}/api/group-members?group_id=${groupId}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch group members: ${response.status} - ${errorText}`);
      }

      const members = await response.json();
      return members;
    } catch (error) {
      console.error('Group members fetch error:', error);
      throw error;
    }
  },

  leaveGroup: async (groupId: number | string, userId: number | string): Promise<void> => {
    if (!groupId) {
      throw new Error('Group ID is required to leave a group');
    }

    if (!userId) {
      throw new Error('User ID is required to leave a group');
    }

    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });

      const url = `${API_BASE_URL}/api/leave-group`;
      const body = JSON.stringify({ group_id: groupId, user_id: userId });

      const response = await fetch(url, { method: 'POST', headers, body });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to leave group: ${response.status} - ${errorText}`);
      }

      console.log(`User ${userId} successfully left group ${groupId}`);
    } catch (error) {
      console.error('Leave group error:', error);
      throw error;
    }
  },
  inviteToGroup: async (groupId: number | string, userId: number | string, role: string): Promise<void> => {
    if (!groupId) {
      throw new Error('Group ID is required to invite a user');
    }

    if (!userId) {
      throw new Error('User ID is required to invite a user');
    }

    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });

      const url = `${API_BASE_URL}/api/add-group-member`;
      const body = JSON.stringify({ group_id: groupId, user_id: userId ,role: 'member'});

      const response = await fetch(url, { method: 'POST', headers, body });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to invite user to group: ${response.status} - ${errorText}`);
      }

      console.log(`User ${userId} successfully invited to group ${groupId}`);
    } catch (error) {
      console.error('Invite to group error:', error);
      throw error;
    }
  },

  fetchNonGroupMembers: async (groupId: number): Promise<NonGroupMember[]> => {
    try {
      console.log('Fetching non-group members for group ID:', groupId);
      const response = await fetch(`${API_BASE_URL}/api/fetch-not-group-members/${groupId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch non-group members: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching non-group members:', error);
      throw error;
    }
  },
  createGroup: async (name: string, description: string, userId: number | string): Promise<Group> => {
    if (!name || !userId) {
      throw new Error('Group name and user ID are required to create a group');
    }

    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });

      // Generate a unique PubNub channel for the group
      const pubnubChannel = `group-${Date.now()}`;

      const body = JSON.stringify({ 
        name, 
        description, 
        created_by: userId,  // Changed from user_id to created_by
        pubnub_channel: pubnubChannel 
      });
      
      const url = `${API_BASE_URL}/api/create-group`;

      const response = await fetch(url, { method: 'POST', headers, body });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create group: ${response.status} - ${errorText}`);
      }

      const newGroup: Group = await response.json();
      console.log('New group created:', newGroup);
      return newGroup;
    } catch (error) {
      console.error('Create group error:', error);
      throw error;
    }
  },
  getGroupInvitations: async (userId: number | string): Promise<GroupInvitation[]> => {
    if (!userId) {
      throw new Error('User ID is required to fetch group invitations');
    }

    try {
      const headers = middleware.addAuthHeader({
        'Content-Type': 'application/json',
      });
      const response = await fetch(`${API_BASE_URL}/api/group-invitations/${userId}`);
  
     
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch group invitations: ${response.status} - ${errorText}`);
      }

      const invitations = await response.json();
      return invitations;
    } catch (error) {
      console.error('Group invitations fetch error:', error);
      throw error;
    }
  }
}
