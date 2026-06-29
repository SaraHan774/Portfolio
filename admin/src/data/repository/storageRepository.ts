/**
 * Storage Repository - 이미지 파일 업로드/삭제 레포지토리
 * Storage API 레이어를 래핑
 */
import * as storageApi from '../api/storageApi';
import type { WorkImage } from '../../core/types';

/**
 * 이미지 업로드
 */
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void,
  options?: { compressOriginal?: boolean }
): Promise<WorkImage> => {
  return storageApi.uploadImage(file, onProgress, options);
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
