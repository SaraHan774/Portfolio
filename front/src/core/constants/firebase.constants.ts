// Firebase collection names and configuration

export const FIREBASE_COLLECTIONS = {
  WORKS: 'works',
  SENTENCE_CATEGORIES: 'sentenceCategories',
  EXHIBITION_CATEGORIES: 'exhibitionCategories',
  SETTINGS: 'settings',
  USERS: 'users',
} as const;

export const SETTINGS_DOC_ID = 'site';

// Firestore has a limit of 10 items per 'in' query
export const FIRESTORE_BATCH_LIMIT = 10;