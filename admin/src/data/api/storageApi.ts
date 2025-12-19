/**
 * Storage API - Firebase Storage 직접 접근
 */
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './client';
import { storagePaths } from '../../core/constants';
import { resizeImage, getImageDimensions } from '../../core/utils';
import { v4 as uuidv4 } from 'uuid';
import type { WorkImage } from '../../core/types';

/**
 * 이미지 업로드 (진행률 콜백 포함)
 */
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<WorkImage> => {
  const imageId = uuidv4();
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${imageId}.${extension}`;

  // 원본 이미지 업로드
  const originalRef = ref(storage, `${storagePaths.worksImages}/${fileName}`);

  // 이미지 크기 정보 가져오기
  const dimensions = await getImageDimensions(file);

  if (onProgress) {
    const uploadTask = uploadBytesResumable(originalRef, file);

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        reject,
        () => resolve()
      );
    });
  } else {
    await uploadBytes(originalRef, file);
  }

  const originalUrl = await getDownloadURL(originalRef);

  // 썸네일 생성 및 업로드
  const thumbnailBlob = await resizeImage(file, {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.7,
  });
  const thumbnailRef = ref(storage, `${storagePaths.worksThumbnails}/${fileName}`);
  await uploadBytes(thumbnailRef, thumbnailBlob);
  const thumbnailUrl = await getDownloadURL(thumbnailRef);

  return {
    id: imageId,
    url: originalUrl,
    thumbnailUrl,
    order: 0,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: file.size,
    uploadedFrom: 'desktop',
  };
};

/**
 * 여러 이미지 업로드
 */
export const uploadImages = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<WorkImage[]> => {
  const results: WorkImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const image = await uploadImage(files[i], (progress) => {
      if (onProgress) {
        onProgress(i, progress);
      }
    });
    image.order = i;
    results.push(image);
  }

  return results;
};

/**
 * 이미지 삭제
 */
export const deleteImage = async (imageId: string, extension = 'jpg'): Promise<void> => {
  const fileName = `${imageId}.${extension}`;

  // 원본 삭제
  try {
    const originalRef = ref(storage, `${storagePaths.worksImages}/${fileName}`);
    await deleteObject(originalRef);
  } catch {
    console.warn(`원본 이미지 삭제 실패: ${fileName}`);
  }

  // 썸네일 삭제
  try {
    const thumbnailRef = ref(storage, `${storagePaths.worksThumbnails}/${fileName}`);
    await deleteObject(thumbnailRef);
  } catch {
    console.warn(`썸네일 이미지 삭제 실패: ${fileName}`);
  }
};

/**
 * 여러 이미지 삭제
 */
export const deleteImages = async (imageIds: string[]): Promise<void> => {
  await Promise.all(imageIds.map((id) => deleteImage(id)));
};

/**
 * 작업의 모든 이미지 삭제
 */
export const deleteWorkImages = async (images: WorkImage[]): Promise<void> => {
  await Promise.all(
    images.map((image) => {
      const extension = image.url.split('.').pop()?.split('?')[0] || 'jpg';
      return deleteImage(image.id, extension);
    })
  );
};

/**
 * 작업 폴더의 모든 이미지 목록 조회
 */
export const listWorkImages = async (): Promise<string[]> => {
  const imagesRef = ref(storage, storagePaths.worksImages);
  const result = await listAll(imagesRef);
  return result.items.map((item) => item.name);
};

/**
 * 이미지 URL 갱신
 */
export const refreshImageUrl = async (path: string): Promise<string> => {
  const imageRef = ref(storage, path);
  return getDownloadURL(imageRef);
};

/**
 * 파비콘 업로드
 */
export const uploadFavicon = async (file: File): Promise<string> => {
  // 기존 파비콘 삭제 시도
  try {
    const existingRef = ref(storage, `${storagePaths.favicon}/favicon.ico`);
    await deleteObject(existingRef);
  } catch {
    // 기존 파비콘이 없으면 무시
  }

  // 새 파비콘 업로드
  const faviconRef = ref(storage, `${storagePaths.favicon}/favicon.ico`);
  await uploadBytes(faviconRef, file);
  return getDownloadURL(faviconRef);
};

/**
 * 파비콘 삭제
 */
export const deleteFavicon = async (): Promise<void> => {
  try {
    const faviconRef = ref(storage, `${storagePaths.favicon}/favicon.ico`);
    await deleteObject(faviconRef);
  } catch {
    // 파비콘이 없으면 무시
  }
};
