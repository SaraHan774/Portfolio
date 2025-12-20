// Works API - Firestore operations for works

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
import { mapFirestoreToWork } from '../mappers';
import { FIREBASE_COLLECTIONS, FIRESTORE_BATCH_LIMIT } from '@/core/constants';
import type { Work } from '@/core/types';
import { NotFoundError, FirestoreError } from '@/core/errors';

/**
 * Fetch all published works
 */
export const fetchPublishedWorks = async (): Promise<Work[]> => {
  try {
    const db = getDb();
    const worksRef = collection(db, FIREBASE_COLLECTIONS.WORKS);
    const q = query(
      worksRef,
      where('isPublished', '==', true),
      orderBy('publishedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
  } catch (error) {
    throw new FirestoreError('Failed to fetch published works', error);
  }
};

/**
 * Fetch work by ID
 */
export const fetchWorkById = async (id: string): Promise<Work> => {
  try {
    const db = getDb();
    const docRef = doc(db, FIREBASE_COLLECTIONS.WORKS, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new NotFoundError('Work', id);
    }

    const work = mapFirestoreToWork(docSnap.id, docSnap.data());

    // Only return published works
    if (!work.isPublished) {
      throw new NotFoundError('Work', id);
    }

    return work;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new FirestoreError(`Failed to fetch work with id ${id}`, error);
  }
};

/**
 * Fetch works by keyword ID
 */
export const fetchWorksByKeywordId = async (keywordId: string): Promise<Work[]> => {
  try {
    const db = getDb();
    const worksRef = collection(db, FIREBASE_COLLECTIONS.WORKS);
    const q = query(
      worksRef,
      where('isPublished', '==', true),
      where('sentenceCategoryIds', 'array-contains', keywordId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
  } catch (error) {
    throw new FirestoreError(`Failed to fetch works by keyword ${keywordId}`, error);
  }
};

/**
 * Fetch works by exhibition category ID
 */
export const fetchWorksByExhibitionCategoryId = async (
  categoryId: string
): Promise<Work[]> => {
  try {
    const db = getDb();
    const worksRef = collection(db, FIREBASE_COLLECTIONS.WORKS);
    const q = query(
      worksRef,
      where('isPublished', '==', true),
      where('exhibitionCategoryIds', 'array-contains', categoryId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
  } catch (error) {
    throw new FirestoreError(
      `Failed to fetch works by exhibition category ${categoryId}`,
      error
    );
  }
};

/**
 * Fetch works by IDs (maintaining order)
 * Uses batched queries to avoid N+1 problem
 */
export const fetchWorksByIds = async (workIds: string[]): Promise<Work[]> => {
  if (workIds.length === 0) return [];

  try {
    const db = getDb();
    const worksRef = collection(db, FIREBASE_COLLECTIONS.WORKS);
    const works: Work[] = [];

    // Firestore 'in' query has a limit of 10 items, so batch the requests
    const batches = [];
    for (let i = 0; i < workIds.length; i += FIRESTORE_BATCH_LIMIT) {
      const batchIds = workIds.slice(i, i + FIRESTORE_BATCH_LIMIT);
      const q = query(
        worksRef,
        where('__name__', 'in', batchIds),
        where('isPublished', '==', true)
      );
      batches.push(getDocs(q));
    }

    // Execute all batches in parallel
    const snapshots = await Promise.all(batches);

    // Collect all works from snapshots
    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        works.push(mapFirestoreToWork(doc.id, doc.data()));
      });
    });

    // Maintain original order
    return workIds
      .map((id) => works.find((w) => w.id === id))
      .filter((w): w is Work => w !== undefined);
  } catch (error) {
    throw new FirestoreError('Failed to fetch works by IDs', error);
  }
};
