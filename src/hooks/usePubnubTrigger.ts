import { useState, useEffect, useCallback, useRef } from 'react';
import { getPubNub, subscribeToChannels, unsubscribeFromChannels, getPresence } from '@/lib/pubnub';
import PubNub from 'pubnub';

interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

interface PresenceInfo {
  isOnline: boolean;
  lastSeen: string; // ISO timestamp
}

type MessageHandler = (messageData?: any) => void;
type TypingHandler = (typingData: TypingIndicator) => void;

export function usePubnubTrigger(
  channel: string | null,
  userId: string | undefined,
  onMessageTrigger: MessageHandler,
  onTypingIndicator?: TypingHandler
) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [presenceData, setPresenceData] = useState<Record<string, PresenceInfo>>({});
  
  // Use refs to maintain stable identities for dependencies
  const channelRef = useRef<string | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  const handlerRef = useRef<MessageHandler>(onMessageTrigger);
  const typingHandlerRef = useRef<TypingHandler | undefined>(onTypingIndicator);
  
  // Update refs when props change
  useEffect(() => {
    handlerRef.current = onMessageTrigger;
  }, [onMessageTrigger]);
  
  useEffect(() => {
    typingHandlerRef.current = onTypingIndicator;
  }, [onTypingIndicator]);
  
  useEffect(() => {
    if (channel !== channelRef.current || userId !== userIdRef.current) {
      channelRef.current = channel;
      userIdRef.current = userId;
    }
  }, [channel, userId]);

  // Fetch initial presence data when channel changes
  useEffect(() => {
    if (!channel || !userId) return;
    
    const fetchInitialPresence = async () => {
      try {
        const presence = await getPresence(channel, userId);
        
        // Process occupancy data
        if (presence.channels && presence.channels[channel]) {
          const channelData = presence.channels[channel];
          const occupants = channelData.occupants || [];
          
          // Update presence data for each occupant
          const newPresenceData: Record<string, PresenceInfo> = {};
          occupants.forEach(occupant => {
            const occupantId = occupant.uuid;
            newPresenceData[occupantId] = {
              isOnline: true,
              lastSeen: new Date().toISOString()
            };
          });
          
          setPresenceData(prev => ({...prev, ...newPresenceData}));
        }
      } catch (err) {
        // Silently fail as this is not critical
      }
    };
    
    fetchInitialPresence();
  }, [channel, userId]);

  // Create a stable listener reference that won't cause effect reruns
  const createListener = useCallback(() => {
    return {
      message: function(event: PubNub.MessageEvent) {
        setLastMessage({
          channel: event.channel,
          publisher: event.publisher,
          message: event.message,
          timetoken: event.timetoken,
          received: new Date().toISOString()
        });
        
        const message = event.message;
        
        if (message && typeof message === 'object') {
          if (message.type === 'typing_indicator' && typingHandlerRef.current) {
            typingHandlerRef.current({
              userId: message.userId,
              isTyping: message.isTyping,
              timestamp: message.timestamp
            });
            return;
          }
          
          if (message.type === 'NEW_MESSAGE') {
            handlerRef.current(message);
            return;
          }
        }
        
        handlerRef.current(message);
      },
      presence: function(presenceEvent: PubNub.PresenceEvent) {
        if (!presenceEvent.uuid) return;
        
        const participantId = presenceEvent.uuid;
        const timestamp = new Date().toISOString();
        
        // Handle join, leave, timeout events
        if (presenceEvent.action === 'join') {
          setPresenceData(prev => ({
            ...prev,
            [participantId]: { 
              isOnline: true, 
              lastSeen: timestamp 
            }
          }));
        } 
        else if (['leave', 'timeout'].includes(presenceEvent.action)) {
          setPresenceData(prev => ({
            ...prev,
            [participantId]: { 
              isOnline: false, 
              lastSeen: timestamp 
            }
          }));
        }
      },
      status: function(statusEvent: PubNub.StatusEvent) {
        if (statusEvent.category === 'PNConnectedCategory') {
          setIsSubscribed(true);
        } else if (statusEvent.category === 'PNDisconnectedCategory') {
          setIsSubscribed(false);
        } else if (statusEvent.error) {
          setError('Failed to connect to notification service.');
        }
      }
    };
  }, []);
  
  // Subscribe/unsubscribe logic with debounce protection
  useEffect(() => {
    if (!channel || !userId) {
      setIsSubscribed(false);
      return;
    }
    
    // Use a timeout to debounce rapid subscription changes
    const subscriptionTimeout = setTimeout(() => {
      try {
        const listener = createListener();
        subscribeToChannels(channel, listener, userId);
        
        return () => {
          if (channelRef.current !== channel) {
            unsubscribeFromChannels(channel, listener, userId);
            setIsSubscribed(false);
          }
        };
      } catch (error) {
        setError('Failed to setup notification service.');
      }
    }, 300);
    
    return () => {
      clearTimeout(subscriptionTimeout);
    };
  }, [channel, userId, createListener]);

  // Format lastSeen as a relative time (memoize to prevent dependency loops)
  const getContactPresence = useCallback((contactId: string) => {
    const presence = presenceData[contactId];
    
    if (!presence) {
      return { isOnline: false, lastSeen: 'Unknown' };
    }
    
    // Format the last seen time as relative time
    let lastSeen = 'Unknown';
    try {
      if (presence.lastSeen) {
        const lastSeenDate = new Date(presence.lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMins = Math.round(diffMs / 60000);
        
        if (diffMins < 1) {
          lastSeen = 'Just now';
        } else if (diffMins < 60) {
          lastSeen = `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
        } else {
          const diffHours = Math.floor(diffMins / 60);
          if (diffHours < 24) {
            lastSeen = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
          } else {
            lastSeen = lastSeenDate.toLocaleString();
          }
        }
      }
    } catch (e) {
      // Fallback to default if date parsing fails
    }
    
    return { 
      isOnline: presence.isOnline,
      lastSeen
    };
  }, [presenceData]); // Only depend on presenceData

  return { 
    isSubscribed, 
    error, 
    lastMessage,
    getContactPresence,
    presenceData
  };
}
