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
  // Maintain stable references for frequent state updates
  const [state, setState] = useState({
    isSubscribed: false,
    error: null as string | null,
    lastMessage: null as any,
  });
  
  // Use a ref for presence data to prevent re-renders on internal updates
  const presenceDataRef = useRef<Record<string, PresenceInfo>>({});
  const [presenceVersion, setPresenceVersion] = useState(0);
  
  // Track connection stability with refs
  const channelRef = useRef<string | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  const handlerRef = useRef<MessageHandler>(onMessageTrigger);
  const typingHandlerRef = useRef<TypingHandler | undefined>(onTypingIndicator);
  
  // Enhanced connection stability tracking
  const presenceTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const reconnectAttemptRef = useRef<number>(0);
  const stableConnectionRef = useRef<boolean>(false);
  const subscriptionRef = useRef<boolean>(false);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastConnectionEventRef = useRef<number>(0);
  const connectionEventCounterRef = useRef<number>(0);
  
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

  // Debounced presence update function with additional stability checks
  const updatePresence = useCallback((userId: string, isOnline: boolean, timestamp: string) => {
    // Clear any existing timeout for this user
    if (presenceTimeoutsRef.current[userId]) {
      clearTimeout(presenceTimeoutsRef.current[userId]);
    }
    
    // For own user presence, don't process frequent changes
    if (userId === userIdRef.current) {
      if (isOnline === false) {
        // Ignore offline events for own user - likely connection glitches
        return;
      }
      
      // Immediately set own user as online without debounce
      presenceDataRef.current[userId] = { 
        isOnline: true, 
        lastSeen: timestamp 
      };
      
      // Trigger a presence version update to refresh dependent components
      setPresenceVersion(prev => prev + 1);
      return;
    }
    
    // Set a timeout to update the presence state (increased debounce to 3 seconds)
    presenceTimeoutsRef.current[userId] = setTimeout(() => {
      const currentData = presenceDataRef.current[userId];
      
      // Only update if status is different or there's no existing data
      if (!currentData || currentData.isOnline !== isOnline) {
        presenceDataRef.current[userId] = { 
          isOnline, 
          lastSeen: timestamp 
        };
        
        // Trigger a presence version update
        setPresenceVersion(prev => prev + 1);
      }
    }, 3000); // 3 second debounce for other users
  }, []);

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
          
          // Update presence data for each occupant - don't cause re-renders
          occupants.forEach(occupant => {
            const occupantId = occupant.uuid;
            presenceDataRef.current[occupantId] = {
              isOnline: true,
              lastSeen: new Date().toISOString()
            };
          });
          
          // After batch updating, trigger a single version update
          setPresenceVersion(prev => prev + 1);
        }
      } catch (err) {
        // Silently fail as this is not critical
      }
    };
    
    fetchInitialPresence();
  }, [channel, userId]);

  // Create a stable listener that won't contribute to re-renders
  const createListener = useCallback(() => {
    return {
      message: function(event: PubNub.MessageEvent) {
        const newMessage = {
          channel: event.channel,
          publisher: event.publisher,
          message: event.message,
          timetoken: event.timetoken,
          received: new Date().toISOString()
        };

        setState(prev => ({
          ...prev,
          lastMessage: newMessage
        }));
        
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
        
        // Track presence event velocity to detect unstable connections
        const now = Date.now();
        if (now - lastConnectionEventRef.current < 5000) {
          connectionEventCounterRef.current++;
          
          // If we get too many events in a short period, they're likely duplicates
          if (connectionEventCounterRef.current > 5) {
            // Ignore frequent presence events - likely connection instability
            console.log('[PubNub] Ignoring frequent presence event, possibly unstable connection');
            return;
          }
        } else {
          connectionEventCounterRef.current = 0;
          lastConnectionEventRef.current = now;
        }
        
        // Use the debounced update function
        if (presenceEvent.action === 'join') {
          if (!stableConnectionRef.current && participantId === userIdRef.current) {
            stableConnectionRef.current = true;
            console.log('[PubNub] Stable connection established for user', participantId);
          }
          updatePresence(participantId, true, timestamp);
        } 
        else if (['leave', 'timeout'].includes(presenceEvent.action)) {
          // For our own user, be very cautious about "leave" events
          if (participantId === userIdRef.current) {
            console.log('[PubNub] Own presence leave/timeout ignored');
            // Don't update status - this is likely a temporary connectivity issue
          } else {
            updatePresence(participantId, false, timestamp);
          }
        }
      },
      status: function(statusEvent: PubNub.StatusEvent) {
        // Guard against rapid status changes by tracking timing
        const now = Date.now();
        const minInterval = 2000; // Minimum milliseconds between status updates
        
        // If we just processed a status event, ignore this one
        if (now - lastConnectionEventRef.current < minInterval) {
          connectionEventCounterRef.current++;
          
          if (connectionEventCounterRef.current > 3) {
            // Too many status events - connection is unstable
            console.log('[PubNub] Ignoring rapid status event:', statusEvent.category);
            return;
          }
        } else {
          connectionEventCounterRef.current = 0;
          lastConnectionEventRef.current = now;
        }
        
        if (statusEvent.category === 'PNConnectedCategory') {
          setState(prev => ({...prev, isSubscribed: true}));
          stableConnectionRef.current = true;
          reconnectAttemptRef.current = 0;
          console.log('[PubNub] Connected:', statusEvent.category);
          
          // Clear any pending connection timer
          if (connectionTimerRef.current) {
            clearTimeout(connectionTimerRef.current);
            connectionTimerRef.current = null;
          }
        } else if (statusEvent.category === 'PNDisconnectedCategory') {
          // Don't immediately set as disconnected - this might be temporary
          console.log('[PubNub] Disconnect event received, delaying status update');
          
          // Clear previous timer if any
          if (connectionTimerRef.current) {
            clearTimeout(connectionTimerRef.current);
          }
          
          // Set a longer timeout before considering truly disconnected
          connectionTimerRef.current = setTimeout(() => {
            if (!stableConnectionRef.current) {
              setState(prev => ({...prev, isSubscribed: false}));
              console.log('[PubNub] Connection confirmed as disconnected after timeout');
            }
          }, 8000); // Much longer grace period
        } else if (
          statusEvent.category === 'PNNetworkIssuesCategory' ||
          statusEvent.category === 'PNTimeoutCategory' ||
          statusEvent.category === 'PNBadRequestCategory' ||
          statusEvent.category === 'PNAccessDeniedCategory' ||
          statusEvent.category === 'PNUnknownCategory'
        ) {
          console.error('[PubNub] connection issue:', statusEvent.category);
          setState(prev => ({
            ...prev,
            error: `Connection issue: ${statusEvent.category}`
          }));
          
          // Try to recover from network issues
          if (reconnectAttemptRef.current < 5) {
            reconnectAttemptRef.current++;
            // Don't change isSubscribed state immediately - wait and see if PubNub recovers
          } else {
            setState(prev => ({...prev, isSubscribed: false}));
          }
        }
      }
    };
  }, [updatePresence]);
  
  // Subscribe/unsubscribe logic with enhanced debouncing
  useEffect(() => {
    if (!channel || !userId) {
      setState(prev => ({...prev, isSubscribed: false}));
      return;
    }
    
    // Prevent duplicate subscriptions
    if (subscriptionRef.current) {
      return;
    }
    
    // Use a slightly longer timeout to debounce rapid subscription changes
    const subscriptionTimeout = setTimeout(() => {
      try {
        console.log(`[PubNub] Subscribing to channel ${channel}...`);
        subscriptionRef.current = true;
        const listener = createListener();
        subscribeToChannels(channel, listener, userId);
        
        // Reset connection stability monitor after a delay
        setTimeout(() => {
          stableConnectionRef.current = true;
        }, 5000);
        
        return () => {
          if (channelRef.current !== channel) {
            console.log(`[PubNub] Unsubscribing from channel ${channel}...`);
            unsubscribeFromChannels(channel, listener, userId);
            setState(prev => ({...prev, isSubscribed: false}));
            subscriptionRef.current = false;
            stableConnectionRef.current = false;
            
            // Clear all presence timeouts on unsubscribe
            Object.values(presenceTimeoutsRef.current).forEach(timeout => {
              clearTimeout(timeout);
            });
            presenceTimeoutsRef.current = {};
          }
        };
      } catch (error) {
        console.error('[PubNub] Subscription error:', error);
        setState(prev => ({
          ...prev, 
          error: 'Failed to setup notification service.',
          isSubscribed: false
        }));
        subscriptionRef.current = false;
      }
    }, 500); // Slightly increased debounce time
    
    return () => {
      clearTimeout(subscriptionTimeout);
    };
  }, [channel, userId, createListener]);

  // Return memoized presence data to prevent unnecessary re-renders
  const getContactPresence = useCallback((contactId: string) => {
    // This dependency on presenceVersion ensures the function updates when presence changes
    const presence = presenceDataRef.current[contactId];
    
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
  }, [presenceVersion]);

  // Memoize presence data to avoid causing re-renders
  const presenceData = useMemo(() => {
    const result: Record<string, PresenceInfo> = {};
    
    // Create a copy to maintain referential equality unless content changed
    for (const key in presenceDataRef.current) {
      result[key] = {...presenceDataRef.current[key]};
    }
    
    return result;
  }, [presenceVersion]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all presence update timeouts
      Object.values(presenceTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current);
      }
    };
  }, []);

  return { 
    isSubscribed: state.isSubscribed, 
    error: state.error, 
    lastMessage: state.lastMessage,
    getContactPresence,
    presenceData
  };
}
