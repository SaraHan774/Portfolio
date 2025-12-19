/**
 * Categories API - Firestore Categories 컬렉션 직접 접근
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './client';
import { collections } from '../../core/constants';
import {
  mapFirestoreToSentenceCategory,
  mapFirestoreToExhibitionCategory,
} from '../mappers';
import type { SentenceCategory, ExhibitionCategory } from '../../core/types';

// ============ Sentence Categories ============

const sentenceCollection = collection(db, collections.sentenceCategories);

/**
 * 모든 문장형 카테고리 조회
 */
export const fetchAllSentenceCategories = async (): Promise<SentenceCategory[]> => {
  const q = query(sentenceCollection, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    mapFirestoreToSentenceCategory(doc.id, doc.data())
  );
};

/**
 * 단일 문장형 카테고리 조회
 */
export const fetchSentenceCategoryById = async (
  id: string
): Promise<SentenceCategory | null> => {
  const docRef = doc(db, collections.sentenceCategories, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapFirestoreToSentenceCategory(docSnap.id, docSnap.data());
};

/**
 * 문장형 카테고리 생성
 */
export const createSentenceCategory = async (
  category: Omit<SentenceCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SentenceCategory> => {
  const docRef = await addDoc(sentenceCollection, {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newDoc = await getDoc(docRef);
  return mapFirestoreToSentenceCategory(docRef.id, newDoc.data() || {});
};

/**
 * 문장형 카테고리 수정
 */
export const updateSentenceCategory = async (
  id: string,
  updates: Partial<Omit<SentenceCategory, 'id' | 'createdAt'>>
): Promise<SentenceCategory> => {
  const docRef = doc(db, collections.sentenceCategories, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(docRef);
  return mapFirestoreToSentenceCategory(id, updatedDoc.data() || {});
};

/**
 * 문장형 카테고리 삭제
 */
export const deleteSentenceCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, collections.sentenceCategories, id);
  await deleteDoc(docRef);
};

// ============ Exhibition Categories ============

const exhibitionCollection = collection(db, collections.exhibitionCategories);

/**
 * 모든 전시명 카테고리 조회
 */
export const fetchAllExhibitionCategories = async (): Promise<ExhibitionCategory[]> => {
  const q = query(exhibitionCollection, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    mapFirestoreToExhibitionCategory(doc.id, doc.data())
  );
};

/**
 * 단일 전시명 카테고리 조회
 */
export const fetchExhibitionCategoryById = async (
  id: string
): Promise<ExhibitionCategory | null> => {
  const docRef = doc(db, collections.exhibitionCategories, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapFirestoreToExhibitionCategory(docSnap.id, docSnap.data());
};

/**
 * 전시명 카테고리 생성
 */
export const createExhibitionCategory = async (
  category: Omit<ExhibitionCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExhibitionCategory> => {
  const docRef = await addDoc(exhibitionCollection, {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newDoc = await getDoc(docRef);
  return mapFirestoreToExhibitionCategory(docRef.id, newDoc.data() || {});
};

/**
 * 전시명 카테고리 수정
 */
export const updateExhibitionCategory = async (
  id: string,
  updates: Partial<Omit<ExhibitionCategory, 'id' | 'createdAt'>>
): Promise<ExhibitionCategory> => {
  const docRef = doc(db, collections.exhibitionCategories, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(docRef);
  return mapFirestoreToExhibitionCategory(id, updatedDoc.data() || {});
};

/**
 * 전시명 카테고리 삭제
 */
export const deleteExhibitionCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, collections.exhibitionCategories, id);
  await deleteDoc(docRef);
};

// ============ Shared Operations ============

/**
 * 카테고리 순서 일괄 업데이트
 */
export const updateCategoryOrders = async (
  type: 'sentence' | 'exhibition',
  orders: { id: string; displayOrder: number }[]
): Promise<void> => {
  const collectionName =
    type === 'sentence' ? collections.sentenceCategories : collections.exhibitionCategories;

  const updatePromises = orders.map(({ id, displayOrder }) => {
    const docRef = doc(db, collectionName, id);
    return updateDoc(docRef, { displayOrder });
  });

  await Promise.all(updatePromises);
};
