import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging } from 'firebase/messaging';
import type { FirebaseConfig, FirebaseInstance } from '@/types/firebase';

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

export const initializeFirebase = (): FirebaseInstance => {
  if (typeof window !== 'undefined' && !app) {
    try {
      app = initializeApp(firebaseConfig);
      messaging = getMessaging(app);
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }
  return { app, messaging };
};

export const getMessagingToken = async (): Promise<string> => {
  try {
    if (!messaging) {
      const { messaging: newMessaging } = initializeFirebase();
      if (!newMessaging) {
        console.error('Failed to initialize messaging');
        return '';
      }
      messaging = newMessaging;
    }
    
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return '';
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return '';
    }

    // Get token - ensure messaging is defined
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available');
      return '';
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return '';
  }
};
