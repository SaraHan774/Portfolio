// Settings API - Firestore operations for site settings

import { doc, getDoc } from 'firebase/firestore';
import { getDb } from './client';
import { mapFirestoreToSiteSettings, getDefaultSettings } from '../mappers';
import { FIREBASE_COLLECTIONS, SETTINGS_DOC_ID } from '@/core/constants';
import type { SiteSettings } from '@/core/types';
import { FirestoreError } from '@/core/errors';

/**
 * Fetch site settings
 * Returns default settings if document doesn't exist or on error
 */
export const fetchSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const db = getDb();
    const docRef = doc(db, FIREBASE_COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Return default settings if document doesn't exist
      return getDefaultSettings();
    }

    return mapFirestoreToSiteSettings(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Failed to fetch site settings, using defaults:', error);
    // Return default settings on error
    return getDefaultSettings();
  }
};
