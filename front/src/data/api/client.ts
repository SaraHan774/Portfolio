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
};

// Firebase app instance
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

/**
 * Get Firebase app instance (lazy initialization)
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
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