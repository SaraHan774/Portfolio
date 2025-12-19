// Categories Firestore 서비스 (Front-end용 - 읽기 전용)
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
import type { SentenceCategory, ExhibitionCategory, KeywordCategory, WorkOrder } from '@/types';

// Sentence Categories
const SENTENCE_COLLECTION = 'sentenceCategories';

// Firestore 데이터를 SentenceCategory 타입으로 변환
const mapFirestoreToSentenceCategory = (
  id: string,
  data: Record<string, unknown>
): SentenceCategory => ({
  id,
  sentence: (data.sentence as string) || '',
  keywords: (data.keywords as KeywordCategory[]) || [],
  displayOrder: (data.displayOrder as number) || 0,
  isActive: (data.isActive as boolean) ?? true,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

// 활성화된 문장형 카테고리 조회
export const getSentenceCategories = async (): Promise<SentenceCategory[]> => {
  const categoriesRef = collection(db, SENTENCE_COLLECTION);
  const q = query(
    categoriesRef,
    where('isActive', '==', true),
    orderBy('displayOrder', 'asc')
  );
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

// 키워드 ID로 키워드 정보 조회
export const getKeywordById = async (
  keywordId: string
): Promise<KeywordCategory | null> => {
  const categories = await getSentenceCategories();

  for (const category of categories) {
    const keyword = category.keywords.find((k) => k.id === keywordId);
    if (keyword) {
      return keyword;
    }
  }

  return null;
};

// 키워드 ID로 해당 문장 카테고리 조회
export const getSentenceByKeywordId = async (
  keywordId: string
): Promise<SentenceCategory | null> => {
  const categories = await getSentenceCategories();

  for (const category of categories) {
    const keyword = category.keywords.find((k) => k.id === keywordId);
    if (keyword) {
      return category;
    }
  }

  return null;
};

// Exhibition Categories
const EXHIBITION_COLLECTION = 'exhibitionCategories';

// Firestore 데이터를 ExhibitionCategory 타입으로 변환
const mapFirestoreToExhibitionCategory = (
  id: string,
  data: Record<string, unknown>
): ExhibitionCategory => ({
  id,
  title: (data.title as string) || '',
  description: (data.description as ExhibitionCategory['description']) || {
    exhibitionType: '',
    venue: '',
    year: new Date().getFullYear(),
  },
  displayOrder: (data.displayOrder as number) || 0,
  workOrders: (data.workOrders as WorkOrder[]) || [],
  isActive: (data.isActive as boolean) ?? true,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

// 활성화된 전시명 카테고리 조회
export const getExhibitionCategories = async (): Promise<ExhibitionCategory[]> => {
  const categoriesRef = collection(db, EXHIBITION_COLLECTION);
  const q = query(
    categoriesRef,
    where('isActive', '==', true),
    orderBy('displayOrder', 'asc')
  );
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
