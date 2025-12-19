/**
 * Works API - Firestore Works 컬렉션 직접 접근
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
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './client';
import { collections } from '../../core/constants';
import { mapFirestoreToWork } from '../mappers';
import type { Work, WorkImage } from '../../core/types';

const worksCollection = collection(db, collections.works);

/**
 * 모든 작업 조회
 */
export const fetchAllWorks = async (): Promise<Work[]> => {
  const q = query(worksCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
};

/**
 * 공개된 작업만 조회
 */
export const fetchPublishedWorks = async (): Promise<Work[]> => {
  const q = query(
    worksCollection,
    where('isPublished', '==', true),
    orderBy('publishedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
};

/**
 * 단일 작업 조회
 */
export const fetchWorkById = async (id: string): Promise<Work | null> => {
  const docRef = doc(db, collections.works, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapFirestoreToWork(docSnap.id, docSnap.data());
};

/**
 * 작업 생성
 */
export const createWork = async (
  work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Work> => {
  const docRef = await addDoc(worksCollection, {
    ...work,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: work.isPublished ? serverTimestamp() : null,
  });

  const newDoc = await getDoc(docRef);
  return mapFirestoreToWork(docRef.id, newDoc.data() || {});
};

/**
 * 작업 수정
 */
export const updateWork = async (
  id: string,
  updates: Partial<Omit<Work, 'id' | 'createdAt'>>
): Promise<Work> => {
  const docRef = doc(db, collections.works, id);

  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  // 공개 상태가 변경되면 publishedAt 업데이트
  if (updates.isPublished !== undefined) {
    updateData.publishedAt = updates.isPublished ? serverTimestamp() : null;
  }

  await updateDoc(docRef, updateData);

  const updatedDoc = await getDoc(docRef);
  return mapFirestoreToWork(id, updatedDoc.data() || {});
};

/**
 * 작업 삭제 (Firestore 문서만)
 */
export const deleteWork = async (id: string): Promise<void> => {
  const docRef = doc(db, collections.works, id);
  await deleteDoc(docRef);
};

/**
 * 작업 데이터 조회 (이미지 목록 포함)
 */
export const fetchWorkWithImages = async (id: string): Promise<{ work: Work; images: WorkImage[] } | null> => {
  const work = await fetchWorkById(id);
  if (!work) return null;
  return { work, images: work.images };
};

/**
 * 조회수 증가
 */
export const incrementViewCount = async (id: string): Promise<void> => {
  const docRef = doc(db, collections.works, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentCount = (docSnap.data().viewCount as number) || 0;
    await updateDoc(docRef, {
      viewCount: currentCount + 1,
    });
  }
};
