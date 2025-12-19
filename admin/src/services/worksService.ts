// Works Firestore 서비스
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { deleteWorkImages } from './storageService';
import type { Work, WorkImage, WorkVideo } from '../types';

const COLLECTION_NAME = 'works';

// Firestore 데이터를 Work 타입으로 변환
const mapFirestoreToWork = (id: string, data: Record<string, unknown>): Work => ({
  id,
  title: data.title as string || '',
  year: data.year as number | undefined,
  shortDescription: data.shortDescription as string | undefined,
  fullDescription: data.fullDescription as string | undefined,
  thumbnailImageId: data.thumbnailImageId as string || '',
  images: (data.images as WorkImage[]) || [],
  videos: (data.videos as WorkVideo[]) || [],
  caption: data.caption as string | undefined,
  sentenceCategoryIds: (data.sentenceCategoryIds as string[]) || [],
  exhibitionCategoryIds: (data.exhibitionCategoryIds as string[]) || [],
  isPublished: data.isPublished as boolean || false,
  viewCount: data.viewCount as number | undefined,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  publishedAt: (data.publishedAt as Timestamp)?.toDate() || undefined,
});

// 모든 작업 조회
export const getWorks = async (): Promise<Work[]> => {
  const worksRef = collection(db, COLLECTION_NAME);
  const q = query(worksRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
};

// 공개된 작업만 조회
export const getPublishedWorks = async (): Promise<Work[]> => {
  const worksRef = collection(db, COLLECTION_NAME);
  const q = query(
    worksRef,
    where('isPublished', '==', true),
    orderBy('publishedAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
};

// 단일 작업 조회
export const getWork = async (id: string): Promise<Work | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapFirestoreToWork(docSnap.id, docSnap.data());
};

// 작업 생성
export const createWork = async (
  work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Work> => {
  const worksRef = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(worksRef, {
    ...work,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: work.isPublished ? serverTimestamp() : null,
  });

  const newDoc = await getDoc(docRef);
  return mapFirestoreToWork(docRef.id, newDoc.data() || {});
};

// 작업 수정
export const updateWork = async (
  id: string,
  updates: Partial<Omit<Work, 'id' | 'createdAt'>>
): Promise<Work> => {
  const docRef = doc(db, COLLECTION_NAME, id);

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

// 작업 삭제 (Storage 이미지도 함께 삭제)
export const deleteWork = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);

  // 먼저 작업 데이터를 조회하여 이미지 목록 확인
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const workData = docSnap.data();
    const images = (workData.images as WorkImage[]) || [];

    // Storage에서 이미지 삭제 (이미지가 있는 경우에만)
    if (images.length > 0) {
      try {
        await deleteWorkImages(images);
        console.log(`작업 ${id}의 이미지 ${images.length}개가 Storage에서 삭제되었습니다.`);
      } catch (error) {
        // Storage 삭제 실패해도 Firestore 문서는 삭제 진행
        console.error('Storage 이미지 삭제 중 오류 (계속 진행):', error);
      }
    }
  }

  // Firestore 문서 삭제
  await deleteDoc(docRef);
};

// 조회수 증가
export const incrementViewCount = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentCount = (docSnap.data().viewCount as number) || 0;
    await updateDoc(docRef, {
      viewCount: currentCount + 1,
    });
  }
};
