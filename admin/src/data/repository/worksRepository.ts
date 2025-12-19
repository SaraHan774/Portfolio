/**
 * Works Repository - 작품 데이터 레포지토리
 * API 레이어를 래핑하고 캐싱 로직 제공
 */
import * as worksApi from '../api/worksApi';
import * as storageApi from '../api/storageApi';
import { cacheKeys, cacheConfig } from './cacheKeys';
import type { Work, WorkImage } from '../../core/types';

/**
 * 캐시 키 및 설정 export (React Query에서 사용)
 */
export const worksCacheKeys = cacheKeys.works;
export const worksCacheConfig = cacheConfig.dynamic;

/**
 * 모든 작품 조회
 */
export const getWorks = async (): Promise<Work[]> => {
  return worksApi.fetchAllWorks();
};

/**
 * 공개된 작품만 조회
 */
export const getPublishedWorks = async (): Promise<Work[]> => {
  return worksApi.fetchPublishedWorks();
};

/**
 * 단일 작품 조회
 */
export const getWork = async (id: string): Promise<Work | null> => {
  return worksApi.fetchWorkById(id);
};

/**
 * 작품 생성
 */
export const createWork = async (
  work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Work> => {
  return worksApi.createWork(work);
};

/**
 * 작품 수정
 */
export const updateWork = async (
  id: string,
  updates: Partial<Omit<Work, 'id' | 'createdAt'>>
): Promise<Work> => {
  return worksApi.updateWork(id, updates);
};

/**
 * 작품 삭제 (Storage 이미지도 함께 삭제)
 */
export const deleteWork = async (id: string): Promise<void> => {
  // 먼저 작품 데이터를 조회하여 이미지 목록 확인
  const work = await worksApi.fetchWorkById(id);

  if (work && work.images.length > 0) {
    try {
      await storageApi.deleteWorkImages(work.images);
      console.log(`작업 ${id}의 이미지 ${work.images.length}개가 Storage에서 삭제되었습니다.`);
    } catch (error) {
      // Storage 삭제 실패해도 Firestore 문서는 삭제 진행
      console.error('Storage 이미지 삭제 중 오류 (계속 진행):', error);
    }
  }

  await worksApi.deleteWork(id);
};

/**
 * 조회수 증가
 */
export const incrementViewCount = async (id: string): Promise<void> => {
  return worksApi.incrementViewCount(id);
};

/**
 * 이미지 업로드
 */
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<WorkImage> => {
  return storageApi.uploadImage(file, onProgress);
};

/**
 * 여러 이미지 업로드
 */
export const uploadImages = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<WorkImage[]> => {
  return storageApi.uploadImages(files, onProgress);
};

/**
 * 이미지 삭제
 */
export const deleteImage = async (imageId: string, extension?: string): Promise<void> => {
  return storageApi.deleteImage(imageId, extension);
};

/**
 * 작업의 모든 이미지 삭제
 */
export const deleteWorkImages = async (images: WorkImage[]): Promise<void> => {
  return storageApi.deleteWorkImages(images);
};
