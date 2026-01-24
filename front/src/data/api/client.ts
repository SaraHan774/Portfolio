// Firebase client initialization for data layer

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase app instance
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

/**
 * Validate Firebase configuration
 * Throws error if required config values are missing
 */
const validateFirebaseConfig = (): void => {
  const requiredFields: Array<{ key: keyof typeof firebaseConfig; name: string }> = [
    { key: 'apiKey', name: 'NEXT_PUBLIC_FIREBASE_API_KEY' },
    { key: 'projectId', name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' },
    { key: 'appId', name: 'NEXT_PUBLIC_FIREBASE_APP_ID' },
  ];

  const missing = requiredFields.filter((field) => !firebaseConfig[field.key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase configuration: ${missing.map(f => f.name).join(', ')}. ` +
        'Please check your .env file or environment configuration.'
    );
  }
};

/**
 * Get Firebase app instance (lazy initialization)
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    validateFirebaseConfig();
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
};

/**
 * Get Firestore instance
 */
export const getDb = (): Firestore => {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
};

/**
 * Get Firebase Storage instance
 */
export const getStorageInstance = (): FirebaseStorage => {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
};