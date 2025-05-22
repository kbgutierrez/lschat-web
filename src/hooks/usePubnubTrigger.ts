import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getPubNub, subscribeToChannels, unsubscribeFromChannels, getPresence } from '@/lib/pubnub';
import PubNub from 'pubnub';

interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

interface PresenceInfo {
  isOnline: boolean;
  lastSeen: string;
}

type MessageHandler = (messageData?: any) => void;
type TypingHandler = (typingData: TypingIndicator) => void;

export function usePubnubTrigger(
  channel: string | null,
  userId: string | undefined,
  onMessageTrigger: MessageHandler,
  onTypingIndicator?: TypingHandler
) {
  const [state, setState] = useState({
    isSubscribed: false,
    error: null as string | null,
    lastMessage: null as any,
  });
  
  const presenceDataRef = useRef<Record<string, PresenceInfo>>({});
  const [presenceVersion, setPresenceVersion] = useState(0);
  
  const channelRef = useRef<string | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  const handlerRef = useRef<MessageHandler>(onMessageTrigger);
  const typingHandlerRef = useRef<TypingHandler | undefined>(onTypingIndicator);
  
  const presenceTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const presenceProcessingRef = useRef<Record<string, number>>({});
  const reconnectAttemptRef = useRef<number>(0);
  const stableConnectionRef = useRef<boolean>(false);
  const subscriptionRef = useRef<boolean>(false);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastConnectionEventRef = useRef<number>(0);
  const connectionEventCounterRef = useRef<number>(0);
  
  const lastFetchTimeRef = useRef<number>(0);
  const fetchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedMessageRef = useRef<string>('');
  
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

  const updatePresence = useCallback((userId: string, isOnline: boolean, timestamp: string) => {
    const now = Date.now();
    const lastProcessed = presenceProcessingRef.current[userId] || 0;
    
    if (now - lastProcessed < 5000) {
      return;
    }
    presenceProcessingRef.current[userId] = now;
    
    if (presenceTimeoutsRef.current[userId]) {
      clearTimeout(presenceTimeoutsRef.current[userId]);
    }
    
    if (userId === userIdRef.current) {
      presenceDataRef.current[userId] = {
        isOnline,
        lastSeen: timestamp || new Date().toISOString()
      };
      
      setPresenceVersion(v => v + 1);
      return;
    }
    
    presenceTimeoutsRef.current[userId] = setTimeout(() => {
      presenceDataRef.current[userId] = {
        isOnline,
        lastSeen: timestamp || new Date().toISOString()
      };
      
      setPresenceVersion(v => v + 1);
      delete presenceTimeoutsRef.current[userId];
    }, 5000);
  }, []);
  
  const debouncedMessageTrigger = useCallback((messageData: any) => {
    const now = Date.now();
    
    const isNotification = messageData && typeof messageData === 'object' && 
      (messageData.type === 'NEW_MESSAGE' || messageData.type === 'new_message' || 
       messageData.action === 'new_message');
    
    if (isNotification) {

      
      if (fetchDebounceTimerRef.current) {
        clearTimeout(fetchDebounceTimerRef.current);
        fetchDebounceTimerRef.current = null;
      }
      
      setTimeout(() => {
        console.log('🚀 Executing message fetch from notification');
        lastFetchTimeRef.current = Date.now();
        if (handlerRef.current) {
          handlerRef.current(messageData);
        }
      }, 10);
      
      return;
    }
    
    const messageHash = messageData ? JSON.stringify(messageData) : '';
    if (!isNotification && messageHash && messageHash === lastProcessedMessageRef.current) {
      console.log('Skipping duplicate content message');
      return;
    }
    
    if (isNotification) {
      const notificationId = `${messageHash}_${Date.now()}`;
      console.log('Processing notification message with ID:', notificationId);
      
      if (fetchDebounceTimerRef.current) {
        clearTimeout(fetchDebounceTimerRef.current);
        fetchDebounceTimerRef.current = null;
      }
      
      if (now - lastFetchTimeRef.current < 300) {
        console.log(`Debouncing message fetch - scheduling in 100ms (last fetch: ${now - lastFetchTimeRef.current}ms ago)`);
        fetchDebounceTimerRef.current = setTimeout(() => {
          console.log('Executing debounced message fetch');
          lastFetchTimeRef.current = Date.now();
          if (handlerRef.current) {
            handlerRef.current(messageData);
          }
        }, 100);
        return;
      }
      
      console.log('Triggering message fetch immediately', messageData);
      lastFetchTimeRef.current = now;
      if (handlerRef.current) {
        handlerRef.current(messageData);
      }
    } else if (messageData) {
      lastProcessedMessageRef.current = messageHash;
      
      if (handlerRef.current) {
        handlerRef.current(messageData);
      }
    }
  }, []);
  
  useEffect(() => {
    if (!channel || !userId) return;
    
    const fetchPresenceData = async () => {
      try {
        const result = await getPresence(channel, userId);
        
        if (result.channels && result.channels[channel]) {
          const now = new Date().toISOString();
          const occupants = result.channels[channel].occupants || [];
          
          Object.keys(presenceDataRef.current).forEach(uid => {
            if (uid !== userId) {
              updatePresence(uid, false, now);
            }
          });
          
          occupants.forEach(occupant => {
            if (occupant.uuid && occupant.uuid !== userId) {
              updatePresence(occupant.uuid, true, now);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching presence data:', error);
      }
    };
    
    fetchPresenceData();
  }, [channel, userId, updatePresence]);
  
  useEffect(() => {
    if (!channel || !userId) {
      setState(prev => {
        if (prev.isSubscribed) {
          return { ...prev, isSubscribed: false };
        }
        return prev;
      });
      return;
    }
    
    console.log(`Setting up PubNub subscription for channel: ${channel}, userId: ${userId}`);
    
    try {
      const pubnub = getPubNub(userId);
      
      const listener: PubNub.ListenerParameters = {
        message: (event) => {
          const isNotification = event.message && 
            typeof event.message === 'object' && 
            (event.message.type === 'NEW_MESSAGE' || 
             event.message.type === 'new_message' || 
             event.message.action === 'new_message');
          
          const isGroupNotification = event.message && 
            typeof event.message === 'object' && 
            (event.message.type === 'NEW_GROUP_MESSAGE' || 
             event.message.action === 'new_group_message');
          
          if (isGroupNotification) {
            console.log(`⚠️ PubNub GROUP notification received on ${event.channel}:`, 
              event.message, 'at', new Date().toISOString());
            
            setState(prev => ({ ...prev, lastMessage: event.message }));
            debouncedMessageTrigger(event.message);
          }
          else if (isNotification) {
            console.log(`⚠️ PubNub notification received on ${event.channel}:`, 
              event.message, 'at', new Date().toISOString());
            
            setState(prev => ({ ...prev, lastMessage: event.message }));
            debouncedMessageTrigger(event.message);
          }
          else if (event.message && typeof event.message === 'object' && 
                  event.message.type === 'typing_indicator' && typingHandlerRef.current) {
            typingHandlerRef.current(event.message as TypingIndicator);
          }
          else {
            console.log(`📨 PubNub message received on ${event.channel}:`, event.message);
            setState(prev => ({ ...prev, lastMessage: event.message }));
            debouncedMessageTrigger(event.message);
          }
        },
        
        presence: (event) => {
          if (['join', 'leave'].includes(event.action)) {
            
          }
          
          if (event.uuid === userId) return;
          
          if (event.action === 'join' || event.action === 'state-change') {
            updatePresence(event.uuid, true, new Date().toISOString());
          } else if (event.action === 'leave' || event.action === 'timeout') {
            updatePresence(event.uuid, false, new Date().toISOString());
          }
        },
        
        status: (status) => {
          if (status.category === 'PNConnectedCategory') {
  
            setState(prev => {
              if (!prev.isSubscribed) {
                return { ...prev, isSubscribed: true, error: null };
              }
              return prev;
            });
            stableConnectionRef.current = true;
          }
          else if (status.category === 'PNNetworkDownCategory' || 
                   status.category === 'PNNetworkIssuesCategory') {
    
            setState(prev => {
              if (prev.isSubscribed) {
                return { ...prev, isSubscribed: false, error: 'Network connection lost' };
              }
              return prev;
            });
            stableConnectionRef.current = false;
          }
          else if (status.category === 'PNReconnectedCategory') {
          
            setState(prev => {
              if (!prev.isSubscribed) {
                return { ...prev, isSubscribed: true, error: null };
              }
              return prev;
            });
            stableConnectionRef.current = true;
          }
          else if (status.category === 'PNConnectionError') {
          
            setState(prev => {
              if (prev.isSubscribed || prev.error !== 'Connection error') {
                return { ...prev, isSubscribed: false, error: 'Connection error' };
              }
              return prev;
            });
            stableConnectionRef.current = false;
          }
        }
      };
      
      if (subscriptionRef.current) {
        try {
          pubnub.removeListener(listener);
          pubnub.unsubscribeAll();
        } catch (err) {
          console.error('Error cleaning up previous subscription:', err);
        }
      }
      
      subscribeToChannels(channel, listener, userId);
      subscriptionRef.current = true;
      
      return () => {
      
        unsubscribeFromChannels(channel, listener, userId);
        subscriptionRef.current = false;
        
        Object.values(presenceTimeoutsRef.current).forEach(timeout => {
          clearTimeout(timeout);
        });
        presenceTimeoutsRef.current = {};
      };
    } catch (error) {
      console.error('Error setting up PubNub:', error);
      setState(prev => {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        if (!prev.error || prev.error !== errorMsg) {
          return { ...prev, isSubscribed: false, error: errorMsg };
        }
        return prev;
      });
    }
  }, [channel, userId, updatePresence, debouncedMessageTrigger]);
  
  const getContactPresence = useCallback((contactId: string): PresenceInfo => {
    const info = presenceDataRef.current[contactId];
    if (!info) {
      return {
        isOnline: false,
        lastSeen: 'Never'
      };
    }
    return info;
  }, [presenceVersion]);
  
  return {
    isSubscribed: state.isSubscribed,
    error: state.error,
    lastMessage: state.lastMessage,
    getContactPresence
  };
}
