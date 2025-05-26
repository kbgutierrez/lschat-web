import PubNub from 'pubnub';
import { v4 as uuidv4 } from 'uuid';

const pubnubConfig = {
  publishKey: process.env.NEXT_PUBLIC_PUBNUB_PUBLISH_KEY,
  subscribeKey: process.env.NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY,
};

let pubnubInstance: PubNub | null = null;

const subscribedChannels = new Set<string>();

export function validatePubNubConfig(): { isValid: boolean; errorMessage?: string } {
  if (!pubnubConfig.publishKey) {
    return { isValid: false, errorMessage: 'PubNub publish key is missing' };
  }
  
  if (!pubnubConfig.subscribeKey) {
    return { isValid: false, errorMessage: 'PubNub subscribe key is missing' };
  }
  
  return { isValid: true };
}

export function getPubNub(userId?: string): PubNub {
  if (!pubnubInstance) {
    const validation = validatePubNubConfig();
    if (!validation.isValid) {
      throw new Error(`PubNub initialization failed: ${validation.errorMessage}`);
    }

    pubnubInstance = new PubNub({
      publishKey: pubnubConfig.publishKey as string,
      subscribeKey: pubnubConfig.subscribeKey as string, 
      userId: userId || `user-${uuidv4()}`,
      logVerbosity: false, 
      heartbeatInterval: 10,
      presenceTimeout: 30,
      keepAlive: true,
      suppressLeaveEvents: false,
      requestMessageCountThreshold: 100,
      restore: true,
 
      retryConfiguration: {
        maximumRetry: 5,
        delay: 2000
      }
    });
    
    pubnubInstance.addListener({
      status: (status) => {
        if (status.category === 'PNNetworkIssuesCategory' || 
            status.category === 'PNNetworkDownCategory') {
          console.error('PubNub network issue detected:', status);
        }
      },
      message: () => {},
    });
    

  } else if (userId && pubnubInstance.getUUID() !== userId) {

    pubnubInstance.setUUID(userId);
  }

  return pubnubInstance;
}

export async function publishMessage(
  channel: string, 
  message: any,
  userId?: string
): Promise<PubNub.PublishResponse> {
  const pubnub = getPubNub(userId);
  
  try {
    const enhancedMessage = {
      ...message,
      _id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      _timestamp: Date.now()
    };
    

    
    return await pubnub.publish({
      channel,
      message: enhancedMessage,
      ttl: 360,
      meta: {
        sender_id: userId || 'anonymous',
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error(`Error publishing message to channel ${channel}:`, error);
    throw error;
  }
}

export async function publishTypingIndicator(
  channel: string,
  userId: string,
  isTyping: boolean
): Promise<PubNub.PublishResponse> {
  const pubnub = getPubNub(userId);
  
  try {
    return await pubnub.publish({
      channel,
      message: {
        type: 'typing_indicator',
        userId,
        isTyping,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    throw error;
  }
}

export function subscribeToChannels(
  channels: string | string[],
  listener: PubNub.ListenerParameters,
  userId?: string
): void {
  const pubnub = getPubNub(userId);
  const channelsArray = Array.isArray(channels) ? channels : [channels];
  
  const newChannels = channelsArray.filter(channel => !subscribedChannels.has(channel));
  
  if (newChannels.length === 0) {
    return;
  }
  
  newChannels.forEach(channel => subscribedChannels.add(channel));
  
  const enhancedListener: PubNub.ListenerParameters = {
    ...listener,
    status: (statusEvent) => {
   
      
      if (statusEvent.category === 'PNNetworkDownCategory' || 
          statusEvent.category === 'PNTimeoutCategory' ||
          statusEvent.category === 'PNNetworkIssuesCategory') {
        console.error('PubNub connection issue, will attempt reconnection');
      }
      
      if (listener.status) listener.status(statusEvent);
    }
  };
  
  pubnub.addListener(enhancedListener);
  

  pubnub.subscribe({
    channels: newChannels,
    withPresence: true,
    channelGroups: [],
    timetoken: 0
  });
}

export function unsubscribeFromChannels(
  channels: string | string[],
  listener?: PubNub.ListenerParameters,
  userId?: string
): void {
  const pubnub = getPubNub(userId);
  const channelsArray = Array.isArray(channels) ? channels : [channels];
  
  channelsArray.forEach(channel => subscribedChannels.delete(channel));
  
  pubnub.unsubscribe({
    channels: channelsArray,
  });
  
  if (listener) {
    pubnub.removeListener(listener);
  }
}

export async function getHistory(
  channel: string,
  count: number = 100,
  userId?: string
): Promise<PubNub.FetchMessagesResponse> {
  const pubnub = getPubNub(userId);
  
  try {
    return await pubnub.fetchMessages({
      channels: [channel],
      count,
      includeUUID: true,
      includeMessageActions: true,
    });
  } catch (error) {
    throw error;
  }
}

export async function getPresence(
  channel: string,
  userId?: string
): Promise<PubNub.HereNowResponse> {
  const pubnub = getPubNub(userId);
  
  try {
    return await pubnub.hereNow({
      channels: [channel],
      includeUUIDs: true,
      includeState: true,
    });
  } catch (error) {
    throw error;
  }
}

export function cleanupPubNub(): void {
  if (pubnubInstance) {
    pubnubInstance.unsubscribeAll();
    pubnubInstance = null;
  }
}

export function formatMessageForPubNub(
  userId: string | number,
  content: string,
  messageType: string = 'text'
) {
  return {
    user_id: userId,
    message_content: content,
    message_type: messageType,
    created_at: new Date().toISOString(),
    is_read: false,
    client_id: `client-${uuidv4()}`,
    _timestamp: Date.now()
  };
}

export function formatLastSeen(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Unknown';
  
  try {
    const lastSeenDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) {
          return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        } else {
          return lastSeenDate.toLocaleDateString();
        }
      }
    }
  } catch (e) {
    return 'Unknown';
  }
}