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
import { ValidationError, UploadError } from '../../core/errors';
import { resizeImage, getImageDimensions, createLogger } from '../../core/utils';
import { v4 as uuidv4 } from 'uuid';
import type { WorkImage } from '../../core/types';

const logger = createLogger('storageApi');

/**
 * 허용된 이미지 확장자
 */
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;

/**
 * 동시 업로드 제한
 */
const UPLOAD_CONCURRENCY = 3;

/**
 * 파일 확장자 검증
 */
const validateFileExtension = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (!extension || !ALLOWED_IMAGE_EXTENSIONS.includes(extension as typeof ALLOWED_IMAGE_EXTENSIONS[number])) {
    throw new ValidationError(
      `지원하지 않는 파일 형식입니다. 허용: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
      'INVALID_FILE_EXTENSION',
      { filename, extension }
    );
  }

  return extension;
};

/**
 * 이미지 업로드 (진행률 콜백 포함)
 */
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<WorkImage> => {
  // 파일 확장자 검증
  const extension = validateFileExtension(file.name);

  const imageId = uuidv4();
  const fileName = `${imageId}.${extension}`;

  // 원본 이미지 업로드
  const originalRef = ref(storage, `${storagePaths.worksImages}/${fileName}`);

  try {
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

    logger.info('이미지 업로드 성공', { action: 'uploadImage', imageId, fileName });

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
  } catch (error) {
    logger.error('이미지 업로드 실패', error, { action: 'uploadImage', fileName });
    throw new UploadError('이미지 업로드에 실패했습니다.', { fileName });
  }
};

/**
 * 여러 이미지 병렬 업로드 (동시성 제한)
 */
export const uploadImages = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<WorkImage[]> => {
  const results: WorkImage[] = [];

  // 동시성 제한을 두고 병렬 업로드
  for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
    const batch = files.slice(i, i + UPLOAD_CONCURRENCY);

    const batchResults = await Promise.all(
      batch.map((file, batchIndex) =>
        uploadImage(file, (progress) => {
          onProgress?.(i + batchIndex, progress);
        })
      )
    );

    // 순서 할당
    results.push(
      ...batchResults.map((img, batchIndex) => ({
        ...img,
        order: i + batchIndex,
      }))
    );
  }

  logger.info('다중 이미지 업로드 완료', {
    action: 'uploadImages',
    count: files.length,
  });

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
    logger.warn(`원본 이미지 삭제 실패: ${fileName}`, { action: 'deleteImage', imageId });
  }

  // 썸네일 삭제
  try {
    const thumbnailRef = ref(storage, `${storagePaths.worksThumbnails}/${fileName}`);
    await deleteObject(thumbnailRef);
  } catch {
    logger.warn(`썸네일 이미지 삭제 실패: ${fileName}`, { action: 'deleteImage', imageId });
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

  try {
    // 새 파비콘 업로드
    const faviconRef = ref(storage, `${storagePaths.favicon}/favicon.ico`);
    await uploadBytes(faviconRef, file);
    const url = await getDownloadURL(faviconRef);
    logger.info('파비콘 업로드 성공', { action: 'uploadFavicon' });
    return url;
  } catch (error) {
    logger.error('파비콘 업로드 실패', error, { action: 'uploadFavicon' });
    throw new UploadError('파비콘 업로드에 실패했습니다.');
  }
};

/**
 * 파비콘 삭제
 */
export const deleteFavicon = async (): Promise<void> => {
  try {
    const faviconRef = ref(storage, `${storagePaths.favicon}/favicon.ico`);
    await deleteObject(faviconRef);
    logger.info('파비콘 삭제 성공', { action: 'deleteFavicon' });
  } catch {
    // 파비콘이 없으면 무시
  }
};

/**
 * 홈 아이콘 업로드 (기본 상태)
 */
export const uploadHomeIcon = async (file: File): Promise<string> => {
  // 파일 확장자 검증
  validateFileExtension(file.name);

  // 기존 홈 아이콘 삭제 시도
  try {
    await deleteHomeIcon();
  } catch {
    // 기존 홈 아이콘이 없으면 무시
  }

  try {
    // 파일 확장자 추출
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const homeIconRef = ref(storage, `${storagePaths.homeIcon}/home-icon.${extension}`);

    await uploadBytes(homeIconRef, file);
    const url = await getDownloadURL(homeIconRef);

    logger.info('홈 아이콘 업로드 성공', { action: 'uploadHomeIcon' });
    return url;
  } catch (error) {
    logger.error('홈 아이콘 업로드 실패', error, { action: 'uploadHomeIcon' });
    throw new UploadError('홈 아이콘 업로드에 실패했습니다.');
  }
};

/**
 * 홈 아이콘 업로드 (호버 상태)
 */
export const uploadHomeIconHover = async (file: File): Promise<string> => {
  // 파일 확장자 검증
  validateFileExtension(file.name);

  // 기존 호버 홈 아이콘 삭제 시도
  try {
    await deleteHomeIconHover();
  } catch {
    // 기존 홈 아이콘이 없으면 무시
  }

  try {
    // 파일 확장자 추출
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const homeIconHoverRef = ref(storage, `${storagePaths.homeIcon}/home-icon-hover.${extension}`);

    await uploadBytes(homeIconHoverRef, file);
    const url = await getDownloadURL(homeIconHoverRef);

    logger.info('홈 아이콘 호버 업로드 성공', { action: 'uploadHomeIconHover' });
    return url;
  } catch (error) {
    logger.error('홈 아이콘 호버 업로드 실패', error, { action: 'uploadHomeIconHover' });
    throw new UploadError('홈 아이콘 호버 업로드에 실패했습니다.');
  }
};

/**
 * 홈 아이콘 삭제 (기본 상태)
 */
export const deleteHomeIcon = async (): Promise<void> => {
  // 모든 가능한 확장자에 대해 삭제 시도
  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

  for (const ext of extensions) {
    try {
      const homeIconRef = ref(storage, `${storagePaths.homeIcon}/home-icon.${ext}`);
      await deleteObject(homeIconRef);
      logger.info(`홈 아이콘 삭제 성공 (${ext})`, { action: 'deleteHomeIcon' });
      return; // 하나라도 성공하면 종료
    } catch {
      // 파일이 없으면 다음 확장자 시도
    }
  }
};

/**
 * 홈 아이콘 삭제 (호버 상태)
 */
export const deleteHomeIconHover = async (): Promise<void> => {
  // 모든 가능한 확장자에 대해 삭제 시도
  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

  for (const ext of extensions) {
    try {
      const homeIconHoverRef = ref(storage, `${storagePaths.homeIcon}/home-icon-hover.${ext}`);
      await deleteObject(homeIconHoverRef);
      logger.info(`홈 아이콘 호버 삭제 성공 (${ext})`, { action: 'deleteHomeIconHover' });
      return; // 하나라도 성공하면 종료
    } catch {
      // 파일이 없으면 다음 확장자 시도
    }
  }
};
