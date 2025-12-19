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
import { ValidationError, NetworkError, NotFoundError } from '../../core/errors';
import { createLogger } from '../../core/utils';
import {
  mapFirestoreToSentenceCategory,
  mapFirestoreToExhibitionCategory,
} from '../mappers';
import type { SentenceCategory, ExhibitionCategory } from '../../core/types';

const logger = createLogger('categoriesApi');

// ============ Validation ============

/**
 * 문장형 카테고리 유효성 검사
 */
const validateSentenceCategoryData = (
  category: Partial<Omit<SentenceCategory, 'id' | 'createdAt' | 'updatedAt'>>,
  isCreate = false
): void => {
  if (isCreate) {
    if (!category.sentence?.trim()) {
      throw new ValidationError('문장은 필수입니다.', 'SENTENCE_REQUIRED');
    }
  }

  if (category.sentence !== undefined && category.sentence.trim().length > 500) {
    throw new ValidationError('문장은 500자를 초과할 수 없습니다.', 'SENTENCE_TOO_LONG');
  }

  if (category.displayOrder !== undefined && category.displayOrder < 0) {
    throw new ValidationError('표시 순서는 0 이상이어야 합니다.', 'INVALID_DISPLAY_ORDER');
  }
};

/**
 * 전시명 카테고리 유효성 검사
 */
const validateExhibitionCategoryData = (
  category: Partial<Omit<ExhibitionCategory, 'id' | 'createdAt' | 'updatedAt'>>,
  isCreate = false
): void => {
  if (isCreate) {
    if (!category.title?.trim()) {
      throw new ValidationError('전시명은 필수입니다.', 'TITLE_REQUIRED');
    }
  }

  if (category.title !== undefined && category.title.trim().length > 200) {
    throw new ValidationError('전시명은 200자를 초과할 수 없습니다.', 'TITLE_TOO_LONG');
  }

  if (category.displayOrder !== undefined && category.displayOrder < 0) {
    throw new ValidationError('표시 순서는 0 이상이어야 합니다.', 'INVALID_DISPLAY_ORDER');
  }

  // 연도 유효성 검사
  if (category.description?.year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (category.description.year < 1900 || category.description.year > currentYear + 10) {
      throw new ValidationError('유효하지 않은 연도입니다.', 'INVALID_YEAR');
    }
  }
};

// ============ Sentence Categories ============

const sentenceCollection = collection(db, collections.sentenceCategories);

/**
 * 모든 문장형 카테고리 조회
 */
export const fetchAllSentenceCategories = async (): Promise<SentenceCategory[]> => {
  try {
    const q = query(sentenceCollection, orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      mapFirestoreToSentenceCategory(doc.id, doc.data())
    );
  } catch (error) {
    logger.error('문장형 카테고리 목록 조회 실패', error, { action: 'fetchAllSentenceCategories' });
    throw new NetworkError('카테고리 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 단일 문장형 카테고리 조회
 */
export const fetchSentenceCategoryById = async (
  id: string
): Promise<SentenceCategory | null> => {
  if (!id?.trim()) {
    throw new ValidationError('카테고리 ID가 필요합니다.', 'ID_REQUIRED');
  }

  try {
    const docRef = doc(db, collections.sentenceCategories, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return mapFirestoreToSentenceCategory(docSnap.id, docSnap.data());
  } catch (error) {
    logger.error('문장형 카테고리 조회 실패', error, { action: 'fetchSentenceCategoryById', categoryId: id });
    throw new NetworkError('카테고리를 불러오는데 실패했습니다.');
  }
};

/**
 * 문장형 카테고리 생성
 */
export const createSentenceCategory = async (
  category: Omit<SentenceCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SentenceCategory> => {
  validateSentenceCategoryData(category, true);

  try {
    const docRef = await addDoc(sentenceCollection, {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newDoc = await getDoc(docRef);
    logger.info('문장형 카테고리 생성', { action: 'createSentenceCategory', categoryId: docRef.id });
    return mapFirestoreToSentenceCategory(docRef.id, newDoc.data() || {});
  } catch (error) {
    logger.error('문장형 카테고리 생성 실패', error, { action: 'createSentenceCategory' });
    throw new NetworkError('카테고리 생성에 실패했습니다.');
  }
};

/**
 * 문장형 카테고리 수정
 */
export const updateSentenceCategory = async (
  id: string,
  updates: Partial<Omit<SentenceCategory, 'id' | 'createdAt'>>
): Promise<SentenceCategory> => {
  if (!id?.trim()) {
    throw new ValidationError('카테고리 ID가 필요합니다.', 'ID_REQUIRED');
  }

  validateSentenceCategoryData(updates);

  try {
    const docRef = doc(db, collections.sentenceCategories, id);

    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.', { categoryId: id });
    }

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    const updatedDoc = await getDoc(docRef);
    logger.info('문장형 카테고리 수정', { action: 'updateSentenceCategory', categoryId: id });
    return mapFirestoreToSentenceCategory(id, updatedDoc.data() || {});
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('문장형 카테고리 수정 실패', error, { action: 'updateSentenceCategory', categoryId: id });
    throw new NetworkError('카테고리 수정에 실패했습니다.');
  }
};

/**
 * 문장형 카테고리 삭제
 */
export const deleteSentenceCategory = async (id: string): Promise<void> => {
  if (!id?.trim()) {
    throw new ValidationError('카테고리 ID가 필요합니다.', 'ID_REQUIRED');
  }

  try {
    const docRef = doc(db, collections.sentenceCategories, id);
    await deleteDoc(docRef);
    logger.info('문장형 카테고리 삭제', { action: 'deleteSentenceCategory', categoryId: id });
  } catch (error) {
    logger.error('문장형 카테고리 삭제 실패', error, { action: 'deleteSentenceCategory', categoryId: id });
    throw new NetworkError('카테고리 삭제에 실패했습니다.');
  }
};

// ============ Exhibition Categories ============

const exhibitionCollection = collection(db, collections.exhibitionCategories);

/**
 * 모든 전시명 카테고리 조회
 */
export const fetchAllExhibitionCategories = async (): Promise<ExhibitionCategory[]> => {
  try {
    const q = query(exhibitionCollection, orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      mapFirestoreToExhibitionCategory(doc.id, doc.data())
    );
  } catch (error) {
    logger.error('전시명 카테고리 목록 조회 실패', error, { action: 'fetchAllExhibitionCategories' });
    throw new NetworkError('카테고리 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 단일 전시명 카테고리 조회
 */
export const fetchExhibitionCategoryById = async (
  id: string
): Promise<ExhibitionCategory | null> => {
  if (!id?.trim()) {
    throw new ValidationError('카테고리 ID가 필요합니다.', 'ID_REQUIRED');
  }

  try {
    const docRef = doc(db, collections.exhibitionCategories, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return mapFirestoreToExhibitionCategory(docSnap.id, docSnap.data());
  } catch (error) {
    logger.error('전시명 카테고리 조회 실패', error, { action: 'fetchExhibitionCategoryById', categoryId: id });
    throw new NetworkError('카테고리를 불러오는데 실패했습니다.');
  }
};

/**
 * 전시명 카테고리 생성
 */
export const createExhibitionCategory = async (
  category: Omit<ExhibitionCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExhibitionCategory> => {
  validateExhibitionCategoryData(category, true);

  try {
    const docRef = await addDoc(exhibitionCollection, {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newDoc = await getDoc(docRef);
    logger.info('전시명 카테고리 생성', { action: 'createExhibitionCategory', categoryId: docRef.id });
    return mapFirestoreToExhibitionCategory(docRef.id, newDoc.data() || {});
  } catch (error) {
    logger.error('전시명 카테고리 생성 실패', error, { action: 'createExhibitionCategory' });
    throw new NetworkError('카테고리 생성에 실패했습니다.');
  }
};

/**
 * 전시명 카테고리 수정
 */
export const updateExhibitionCategory = async (
  id: string,
  updates: Partial<Omit<ExhibitionCategory, 'id' | 'createdAt'>>
): Promise<ExhibitionCategory> => {
  if (!id?.trim()) {
    throw new ValidationError('카테고리 ID가 필요합니다.', 'ID_REQUIRED');
  }

  validateExhibitionCategoryData(updates);

  try {
    const docRef = doc(db, collections.exhibitionCategories, id);

    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.', { categoryId: id });
    }

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    const updatedDoc = await getDoc(docRef);
    logger.info('전시명 카테고리 수정', { action: 'updateExhibitionCategory', categoryId: id });
    return mapFirestoreToExhibitionCategory(id, updatedDoc.data() || {});
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('전시명 카테고리 수정 실패', error, { action: 'updateExhibitionCategory', categoryId: id });
    throw new NetworkError('카테고리 수정에 실패했습니다.');
  }
};

/**
 * 전시명 카테고리 삭제
 */
export const deleteExhibitionCategory = async (id: string): Promise<void> => {
  if (!id?.trim()) {
    throw new ValidationError('카테고리 ID가 필요합니다.', 'ID_REQUIRED');
  }

  try {
    const docRef = doc(db, collections.exhibitionCategories, id);
    await deleteDoc(docRef);
    logger.info('전시명 카테고리 삭제', { action: 'deleteExhibitionCategory', categoryId: id });
  } catch (error) {
    logger.error('전시명 카테고리 삭제 실패', error, { action: 'deleteExhibitionCategory', categoryId: id });
    throw new NetworkError('카테고리 삭제에 실패했습니다.');
  }
};

// ============ Shared Operations ============

/**
 * 카테고리 순서 일괄 업데이트
 */
export const updateCategoryOrders = async (
  type: 'sentence' | 'exhibition',
  orders: { id: string; displayOrder: number }[]
): Promise<void> => {
  if (!orders || orders.length === 0) {
    return;
  }

  // 유효성 검사
  for (const order of orders) {
    if (!order.id?.trim()) {
      throw new ValidationError('카테고리 ID가 필요합니다.', 'ID_REQUIRED');
    }
    if (order.displayOrder < 0) {
      throw new ValidationError('표시 순서는 0 이상이어야 합니다.', 'INVALID_DISPLAY_ORDER');
    }
  }

  const collectionName =
    type === 'sentence' ? collections.sentenceCategories : collections.exhibitionCategories;

  try {
    const updatePromises = orders.map(({ id, displayOrder }) => {
      const docRef = doc(db, collectionName, id);
      return updateDoc(docRef, { displayOrder });
    });

    await Promise.all(updatePromises);
    logger.info('카테고리 순서 업데이트', { action: 'updateCategoryOrders', type, count: orders.length });
  } catch (error) {
    logger.error('카테고리 순서 업데이트 실패', error, { action: 'updateCategoryOrders', type });
    throw new NetworkError('카테고리 순서 변경에 실패했습니다.');
  }
};
