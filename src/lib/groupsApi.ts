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
  }
};
