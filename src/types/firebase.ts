import { FirebaseApp } from 'firebase/app';
import { Messaging } from 'firebase/messaging';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface FirebaseInstance {
  app: FirebaseApp | undefined;
  messaging: Messaging | undefined;
}

// Additional type utilities for Firebase FCM
export interface FCMTokenResponse {
  token: string;
  error?: string;
}

export interface ServiceWorkerRegistration {
  pushManager: {
    subscribe(options: PushSubscriptionOptions): Promise<PushSubscription>;
    getSubscription(): Promise<PushSubscription | null>;
  };
}

export interface PushSubscriptionOptions {
  userVisibleOnly?: boolean;
  applicationServerKey?: ArrayBuffer | string;
}

export interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  options: PushSubscriptionOptions;
  getKey(name: string): ArrayBuffer | null;
  toJSON(): any;
  unsubscribe(): Promise<boolean>;
}
