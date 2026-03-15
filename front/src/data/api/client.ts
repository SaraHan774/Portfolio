// Firebase client initialization for data layer

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

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

// Emulator 연결 여부 추적 (중복 연결 방지)
let emulatorsConnected = false;

/**
 * 개발 환경에서 Firebase Emulator 연결
 */
const connectEmulators = (firestoreDb: Firestore, storageInstance: FirebaseStorage): void => {
  if (emulatorsConnected) return;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') return;

  try {
    connectFirestoreEmulator(firestoreDb, 'localhost', 8080);
    connectStorageEmulator(storageInstance, 'localhost', 9199);
    emulatorsConnected = true;
    console.log('🔧 [Front] Firebase Emulator에 연결되었습니다 (localhost:8080, 9199)');
  } catch (e) {
    console.warn('⚠️ Firebase Emulator 연결 실패', e);
  }
};

/**
 * Get Firestore instance
 */
export const getDb = (): Firestore => {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    // Storage도 미리 초기화해서 emulator 연결을 한 번에 처리
    if (!storage) {
      storage = getStorage(getFirebaseApp());
    }
    connectEmulators(db, storage);
  }
  return db;
};

/**
 * Get Firebase Storage instance
 */
export const getStorageInstance = (): FirebaseStorage => {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
    // Firestore도 미리 초기화해서 emulator 연결을 한 번에 처리
    if (!db) {
      db = getFirestore(getFirebaseApp());
    }
    connectEmulators(db, storage);
  }
  return storage;
};