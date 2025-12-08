// Works Firestore 서비스 (Front-end용 - 읽기 전용)
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Work, WorkImage } from '@/types';

const COLLECTION_NAME = 'works';

// Firestore 데이터를 Work 타입으로 변환
const mapFirestoreToWork = (id: string, data: Record<string, unknown>): Work => ({
  id,
  title: (data.title as string) || '',
  year: data.year as number | undefined,
  shortDescription: data.shortDescription as string | undefined,
  fullDescription: (data.fullDescription as string) || '',
  thumbnailImageId: (data.thumbnailImageId as string) || '',
  images: (data.images as WorkImage[]) || [],
  caption: data.caption as string | undefined,
  sentenceCategoryIds: (data.sentenceCategoryIds as string[]) || [],
  exhibitionCategoryIds: (data.exhibitionCategoryIds as string[]) || [],
  isPublished: (data.isPublished as boolean) || false,
  viewCount: data.viewCount as number | undefined,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  publishedAt: (data.publishedAt as Timestamp)?.toDate() || undefined,
});

// 공개된 모든 작업 조회
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

// 단일 작업 조회 (공개 여부 상관없이 - 상세 페이지용)
export const getWorkById = async (id: string): Promise<Work | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const work = mapFirestoreToWork(docSnap.id, docSnap.data());

  // 비공개 작업은 반환하지 않음
  if (!work.isPublished) {
    return null;
  }

  return work;
};

// 키워드 카테고리 ID로 작업 목록 조회
// 방법 1: 키워드의 workOrders에서 조회 (카테고리 → 작업 방향)
// 방법 2: Work의 sentenceCategoryIds에서 keywordId를 포함하는 작업 조회 (작업 → 카테고리 역방향)
// 현재는 방법 2를 사용 (Admin에서 workOrders 동기화가 안 되어 있을 수 있음)
export const getWorksByKeywordId = async (keywordId: string): Promise<Work[]> => {
  // 방법 1 시도: 키워드의 workOrders에서 조회
  const { getKeywordById } = await import('./categoriesService');
  const keyword = await getKeywordById(keywordId);

  if (keyword && keyword.workOrders && keyword.workOrders.length > 0) {
    // workOrders가 있으면 사용
    const sortedWorkOrders = [...keyword.workOrders].sort((a, b) => a.order - b.order);
    const workIds = sortedWorkOrders.map(wo => wo.workId);
    return getWorksByIds(workIds);
  }

  // 방법 2 폴백: Work의 sentenceCategoryIds에서 keywordId 포함 여부로 조회
  const worksRef = collection(db, COLLECTION_NAME);
  const q = query(
    worksRef,
    where('isPublished', '==', true),
    where('sentenceCategoryIds', 'array-contains', keywordId)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
};

// 전시명 카테고리 ID로 작업 목록 조회
// 방법 1: ExhibitionCategory의 workOrders에서 조회 (카테고리 → 작업 방향)
// 방법 2: Work의 exhibitionCategoryIds에서 categoryId를 포함하는 작업 조회 (작업 → 카테고리 역방향)
export const getWorksByExhibitionCategoryId = async (categoryId: string): Promise<Work[]> => {
  // 방법 1 시도: 전시명 카테고리의 workOrders에서 조회
  const { getExhibitionCategory } = await import('./categoriesService');
  const category = await getExhibitionCategory(categoryId);

  if (category && category.workOrders && category.workOrders.length > 0) {
    // workOrders가 있으면 사용
    const sortedWorkOrders = [...category.workOrders].sort((a, b) => a.order - b.order);
    const workIds = sortedWorkOrders.map(wo => wo.workId);
    return getWorksByIds(workIds);
  }

  // 방법 2 폴백: Work의 exhibitionCategoryIds에서 categoryId 포함 여부로 조회
  const worksRef = collection(db, COLLECTION_NAME);
  const q = query(
    worksRef,
    where('isPublished', '==', true),
    where('exhibitionCategoryIds', 'array-contains', categoryId)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
};

// 여러 작업 ID로 작업 목록 조회 (순서 유지)
export const getWorksByIds = async (workIds: string[]): Promise<Work[]> => {
  if (workIds.length === 0) return [];

  const works: Work[] = [];

  // Firestore는 'in' 쿼리가 10개 제한이 있으므로 개별 조회
  for (const workId of workIds) {
    const work = await getWorkById(workId);
    if (work) {
      works.push(work);
    }
  }

  // 원래 순서 유지
  return workIds
    .map((id) => works.find((w) => w.id === id))
    .filter((w): w is Work => w !== undefined);
};
