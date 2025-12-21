// Categories API - Firestore operations for categories

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { getDb } from './client';
import {
  mapFirestoreToSentenceCategory,
  mapFirestoreToExhibitionCategory,
  findKeywordById,
  findSentenceCategoryByKeywordId,
} from '../mappers';
import { FIREBASE_COLLECTIONS } from '@/core/constants';
import type { SentenceCategory, ExhibitionCategory, KeywordCategory } from '@/core/types';
import { NotFoundError, FirestoreError } from '@/core/errors';

/**
 * Fetch all active sentence categories
 */
export const fetchSentenceCategories = async (): Promise<SentenceCategory[]> => {
  try {
    const db = getDb();
    const categoriesRef = collection(db, FIREBASE_COLLECTIONS.SENTENCE_CATEGORIES);
    const q = query(
      categoriesRef,
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) =>
      mapFirestoreToSentenceCategory(doc.id, doc.data())
    );
  } catch (error) {
    throw new FirestoreError('Failed to fetch sentence categories', error);
  }
};

/**
 * Fetch sentence category by ID
 */
export const fetchSentenceCategoryById = async (
  id: string
): Promise<SentenceCategory> => {
  try {
    const db = getDb();
    const docRef = doc(db, FIREBASE_COLLECTIONS.SENTENCE_CATEGORIES, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new NotFoundError('SentenceCategory', id);
    }

    return mapFirestoreToSentenceCategory(docSnap.id, docSnap.data());
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new FirestoreError(`Failed to fetch sentence category with id ${id}`, error);
  }
};

/**
 * Fetch keyword by ID (searches across all sentence categories)
 */
export const fetchKeywordById = async (
  keywordId: string
): Promise<KeywordCategory> => {
  try {
    const categories = await fetchSentenceCategories();
    const keyword = findKeywordById(categories, keywordId);

    if (!keyword) {
      throw new NotFoundError('Keyword', keywordId);
    }

    return keyword;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new FirestoreError(`Failed to fetch keyword with id ${keywordId}`, error);
  }
};

/**
 * Fetch sentence category containing a specific keyword
 */
export const fetchSentenceCategoryByKeywordId = async (
  keywordId: string
): Promise<SentenceCategory> => {
  try {
    const categories = await fetchSentenceCategories();
    const category = findSentenceCategoryByKeywordId(categories, keywordId);

    if (!category) {
      throw new NotFoundError('SentenceCategory (by keyword)', keywordId);
    }

    return category;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new FirestoreError(
      `Failed to fetch sentence category by keyword ${keywordId}`,
      error
    );
  }
};

/**
 * Fetch all active exhibition categories
 */
export const fetchExhibitionCategories = async (): Promise<ExhibitionCategory[]> => {
  try {
    const db = getDb();
    const categoriesRef = collection(db, FIREBASE_COLLECTIONS.EXHIBITION_CATEGORIES);
    const q = query(
      categoriesRef,
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) =>
      mapFirestoreToExhibitionCategory(doc.id, doc.data())
    );
  } catch (error) {
    throw new FirestoreError('Failed to fetch exhibition categories', error);
  }
};

/**
 * Fetch exhibition category by ID
 */
export const fetchExhibitionCategoryById = async (
  id: string
): Promise<ExhibitionCategory> => {
  try {
    const db = getDb();
    const docRef = doc(db, FIREBASE_COLLECTIONS.EXHIBITION_CATEGORIES, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new NotFoundError('ExhibitionCategory', id);
    }

    return mapFirestoreToExhibitionCategory(docSnap.id, docSnap.data());
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new FirestoreError(
      `Failed to fetch exhibition category with id ${id}`,
      error
    );
  }
};
