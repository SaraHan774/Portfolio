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
  limit,
  startAfter,
  serverTimestamp,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './client';
import { collections, appConfig } from '../../core/constants';
import { ValidationError, NetworkError, NotFoundError } from '../../core/errors';
import { createLogger } from '../../core/utils';
import { mapFirestoreToWork } from '../mappers';
import type { Work, WorkImage, PaginatedResult } from '../../core/types';

const logger = createLogger('worksApi');
const worksCollection = collection(db, collections.works);

/**
 * 작업 데이터 유효성 검사
 */
const validateWorkData = (
  work: Partial<Omit<Work, 'id' | 'createdAt' | 'updatedAt'>>,
  isCreate = false
): void => {
  // 생성 시 필수 필드 검사
  if (isCreate) {
    if (!work.title?.trim()) {
      throw new ValidationError('작품 제목은 필수입니다.', 'TITLE_REQUIRED');
    }
  }

  // 제목 길이 검사
  if (work.title !== undefined && work.title.trim().length > 200) {
    throw new ValidationError('작품 제목은 200자를 초과할 수 없습니다.', 'TITLE_TOO_LONG');
  }

  // 캡션 길이 검사
  if (work.caption !== undefined && work.caption.length > appConfig.text.captionMaxLength) {
    throw new ValidationError(
      `캡션은 ${appConfig.text.captionMaxLength}자를 초과할 수 없습니다.`,
      'CAPTION_TOO_LONG'
    );
  }

  // 이미지 캡션 길이 검사 (이미지별 한 줄 캡션)
  if (work.images !== undefined) {
    const tooLong = work.images.some(
      (img) =>
        img.caption !== undefined &&
        img.caption.length > appConfig.text.imageCaptionMaxLength
    );
    if (tooLong) {
      throw new ValidationError(
        `이미지 캡션은 ${appConfig.text.imageCaptionMaxLength}자를 초과할 수 없습니다.`,
        'IMAGE_CAPTION_TOO_LONG'
      );
    }
  }

  // 연도 유효성 검사
  if (work.year !== undefined && work.year !== null) {
    const currentYear = new Date().getFullYear();
    if (work.year < 1900 || work.year > currentYear + 10) {
      throw new ValidationError('유효하지 않은 연도입니다.', 'INVALID_YEAR');
    }
  }
};

/**
 * 모든 작업 조회
 */
export const fetchAllWorks = async (): Promise<Work[]> => {
  try {
    const q = query(worksCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
  } catch (error) {
    logger.error('작품 목록 조회 실패', error, { action: 'fetchAllWorks' });
    throw new NetworkError('작품 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 커서 기반 페이지네이션으로 작업 조회
 */
export const fetchWorksPaginated = async (
  pageSize: number,
  cursor?: DocumentSnapshot
): Promise<PaginatedResult<Work>> => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize + 1)];
    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    const q = query(worksCollection, ...constraints);
    const snapshot = await getDocs(q);

    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const items = docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
    const lastCursor = docs.length > 0 ? docs[docs.length - 1] : undefined;

    return { items, hasMore, lastCursor };
  } catch (error) {
    logger.error('작품 목록 페이지네이션 조회 실패', error, { action: 'fetchWorksPaginated' });
    throw new NetworkError('작품 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 공개된 작업만 조회
 */
export const fetchPublishedWorks = async (): Promise<Work[]> => {
  try {
    const q = query(
      worksCollection,
      where('isPublished', '==', true),
      orderBy('publishedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => mapFirestoreToWork(doc.id, doc.data()));
  } catch (error) {
    logger.error('공개 작품 목록 조회 실패', error, { action: 'fetchPublishedWorks' });
    throw new NetworkError('작품 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 단일 작업 조회
 */
export const fetchWorkById = async (id: string): Promise<Work | null> => {
  if (!id?.trim()) {
    throw new ValidationError('작품 ID가 필요합니다.', 'ID_REQUIRED');
  }

  try {
    const docRef = doc(db, collections.works, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return mapFirestoreToWork(docSnap.id, docSnap.data());
  } catch (error) {
    logger.error('작품 조회 실패', error, { action: 'fetchWorkById', workId: id });
    throw new NetworkError('작품을 불러오는데 실패했습니다.');
  }
};

/**
 * 작업 생성
 */
export const createWork = async (
  work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Work> => {
  // 입력 유효성 검사
  validateWorkData(work, true);

  try {
    const docRef = await addDoc(worksCollection, {
      ...work,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: work.isPublished ? serverTimestamp() : null,
    });

    const newDoc = await getDoc(docRef);
    const createdWork = mapFirestoreToWork(docRef.id, newDoc.data() || {});

    logger.info('작품 생성 완료', { action: 'createWork', workId: docRef.id });
    return createdWork;
  } catch (error) {
    logger.error('작품 생성 실패', error, { action: 'createWork' });
    throw new NetworkError('작품 생성에 실패했습니다.');
  }
};

/**
 * 작업 수정
 */
export const updateWork = async (
  id: string,
  updates: Partial<Omit<Work, 'id' | 'createdAt'>>
): Promise<Work> => {
  if (!id?.trim()) {
    throw new ValidationError('작품 ID가 필요합니다.', 'ID_REQUIRED');
  }

  // 입력 유효성 검사
  validateWorkData(updates);

  try {
    const docRef = doc(db, collections.works, id);

    // 작품 존재 확인
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new NotFoundError('작품을 찾을 수 없습니다.', { workId: id });
    }

    const existingData = existingDoc.data();
    const wasPublished = existingData.isPublished as boolean;

    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // 공개 상태가 변경될 때만 publishedAt 업데이트
    // 비공개 → 공개: publishedAt 설정
    // 공개 → 비공개: publishedAt 제거
    // 공개 → 공개 (수정만): publishedAt 유지 (건드리지 않음)
    if (updates.isPublished !== undefined) {
      if (updates.isPublished && !wasPublished) {
        updateData.publishedAt = serverTimestamp();
      } else if (!updates.isPublished && wasPublished) {
        updateData.publishedAt = null;
      }
      // 이미 공개 상태에서 수정만 하는 경우 publishedAt을 건드리지 않음
    }

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    const updatedWork = mapFirestoreToWork(id, updatedDoc.data() || {});

    const publishStatus = updates.isPublished ? '게시' : updates.isPublished === false ? '임시저장(비공개)' : '수정';
    logger.info(`작품 ${publishStatus} 완료`, { action: 'updateWork', workId: id, isPublished: updates.isPublished });
    return updatedWork;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('작품 수정 실패', error, { action: 'updateWork', workId: id });
    throw new NetworkError('작품 수정에 실패했습니다.');
  }
};

/**
 * 작업 삭제 (Firestore 문서만)
 */
export const deleteWork = async (id: string): Promise<void> => {
  if (!id?.trim()) {
    throw new ValidationError('작품 ID가 필요합니다.', 'ID_REQUIRED');
  }

  try {
    const docRef = doc(db, collections.works, id);
    await deleteDoc(docRef);
    logger.info('작품 삭제 완료', { action: 'deleteWork', workId: id });
  } catch (error) {
    logger.error('작품 삭제 실패', error, { action: 'deleteWork', workId: id });
    throw new NetworkError('작품 삭제에 실패했습니다.');
  }
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
  if (!id?.trim()) {
    throw new ValidationError('작품 ID가 필요합니다.', 'ID_REQUIRED');
  }

  try {
    const docRef = doc(db, collections.works, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentCount = (docSnap.data().viewCount as number) || 0;
      await updateDoc(docRef, {
        viewCount: currentCount + 1,
      });
    }
  } catch {
    // 조회수 증가 실패는 경고만 표시 (중요하지 않음)
    logger.warn('조회수 증가 실패', { action: 'incrementViewCount', workId: id });
  }
};
