// Categories Firestore 서비스
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SentenceCategory, ExhibitionCategory, WorkOrder } from '../types';

// Sentence Categories
const SENTENCE_COLLECTION = 'sentenceCategories';

// Firestore 데이터를 SentenceCategory 타입으로 변환
const mapFirestoreToSentenceCategory = (
  id: string,
  data: Record<string, unknown>
): SentenceCategory => ({
  id,
  sentence: data.sentence as string || '',
  keywords: (data.keywords as SentenceCategory['keywords']) || [],
  displayOrder: data.displayOrder as number || 0,
  isActive: data.isActive as boolean ?? true,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

// 모든 문장형 카테고리 조회
export const getSentenceCategories = async (): Promise<SentenceCategory[]> => {
  const categoriesRef = collection(db, SENTENCE_COLLECTION);
  const q = query(categoriesRef, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    mapFirestoreToSentenceCategory(doc.id, doc.data())
  );
};

// 단일 문장형 카테고리 조회
export const getSentenceCategory = async (
  id: string
): Promise<SentenceCategory | null> => {
  const docRef = doc(db, SENTENCE_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapFirestoreToSentenceCategory(docSnap.id, docSnap.data());
};

// 문장형 카테고리 생성
export const createSentenceCategory = async (
  category: Omit<SentenceCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SentenceCategory> => {
  const categoriesRef = collection(db, SENTENCE_COLLECTION);
  const docRef = await addDoc(categoriesRef, {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newDoc = await getDoc(docRef);
  return mapFirestoreToSentenceCategory(docRef.id, newDoc.data() || {});
};

// 문장형 카테고리 수정
export const updateSentenceCategory = async (
  id: string,
  updates: Partial<Omit<SentenceCategory, 'id' | 'createdAt'>>
): Promise<SentenceCategory> => {
  const docRef = doc(db, SENTENCE_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(docRef);
  return mapFirestoreToSentenceCategory(id, updatedDoc.data() || {});
};

// 문장형 카테고리 삭제
export const deleteSentenceCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, SENTENCE_COLLECTION, id);
  await deleteDoc(docRef);
};

// Exhibition Categories
const EXHIBITION_COLLECTION = 'exhibitionCategories';

// Firestore 데이터를 ExhibitionCategory 타입으로 변환
const mapFirestoreToExhibitionCategory = (
  id: string,
  data: Record<string, unknown>
): ExhibitionCategory => ({
  id,
  title: data.title as string || '',
  description: (data.description as ExhibitionCategory['description']) || {
    exhibitionType: '',
    venue: '',
    year: new Date().getFullYear(),
  },
  displayOrder: data.displayOrder as number || 0,
  workOrders: (data.workOrders as WorkOrder[]) || [],
  isActive: data.isActive as boolean ?? true,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

// 모든 전시명 카테고리 조회
export const getExhibitionCategories = async (): Promise<ExhibitionCategory[]> => {
  const categoriesRef = collection(db, EXHIBITION_COLLECTION);
  const q = query(categoriesRef, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    mapFirestoreToExhibitionCategory(doc.id, doc.data())
  );
};

// 단일 전시명 카테고리 조회
export const getExhibitionCategory = async (
  id: string
): Promise<ExhibitionCategory | null> => {
  const docRef = doc(db, EXHIBITION_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapFirestoreToExhibitionCategory(docSnap.id, docSnap.data());
};

// 전시명 카테고리 생성
export const createExhibitionCategory = async (
  category: Omit<ExhibitionCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExhibitionCategory> => {
  const categoriesRef = collection(db, EXHIBITION_COLLECTION);
  const docRef = await addDoc(categoriesRef, {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newDoc = await getDoc(docRef);
  return mapFirestoreToExhibitionCategory(docRef.id, newDoc.data() || {});
};

// 전시명 카테고리 수정
export const updateExhibitionCategory = async (
  id: string,
  updates: Partial<Omit<ExhibitionCategory, 'id' | 'createdAt'>>
): Promise<ExhibitionCategory> => {
  const docRef = doc(db, EXHIBITION_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(docRef);
  return mapFirestoreToExhibitionCategory(id, updatedDoc.data() || {});
};

// 전시명 카테고리 삭제
export const deleteExhibitionCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, EXHIBITION_COLLECTION, id);
  await deleteDoc(docRef);
};

// 카테고리 순서 일괄 업데이트
export const updateCategoryOrders = async (
  type: 'sentence' | 'exhibition',
  orders: { id: string; displayOrder: number }[]
): Promise<void> => {
  const collectionName =
    type === 'sentence' ? SENTENCE_COLLECTION : EXHIBITION_COLLECTION;

  const updatePromises = orders.map(({ id, displayOrder }) => {
    const docRef = doc(db, collectionName, id);
    return updateDoc(docRef, { displayOrder });
  });

  await Promise.all(updatePromises);
};
