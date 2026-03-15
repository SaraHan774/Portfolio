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
import { storagePaths, appConfig } from '../../core/constants';
import { ValidationError, UploadError } from '../../core/errors';
import { processImage, getOutputExtension, createLogger } from '../../core/utils';
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
 * - 1회 디코딩으로 dimensions, thumbnail, 압축 원본을 모두 생성
 * - 압축 원본(max 1920px)을 업로드하여 전송 크기 대폭 감소
 */
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<WorkImage> => {
  // 파일 확장자 검증
  const extension = validateFileExtension(file.name);

  const imageId = uuidv4();
  const fileName = `${imageId}.${extension}`;
  const compressedFileName = `${imageId}.${getOutputExtension()}`;

  try {
    // 1회 디코딩: dimensions + thumbnail + 압축 원본 생성
    const { dimensions, thumbnail, original: compressedOriginal } = await processImage(file, {
      thumbnail: appConfig.image.thumbnail,
      original: appConfig.image.original,
    });

    // 업로드할 원본 데이터 결정 (압축본이 있으면 사용, 없으면 원본 파일 그대로)
    const originalData = compressedOriginal ?? file;

    // 압축 원본이 있으면 WebP/JPEG 확장자, 없으면 원본 확장자
    const originalFileName = compressedOriginal ? compressedFileName : fileName;

    const originalRef = ref(storage, `${storagePaths.worksImages}/${originalFileName}`);
    const thumbnailRef = ref(storage, `${storagePaths.worksThumbnails}/${compressedFileName}`);

    const originalUpload = onProgress
      ? new Promise<void>((resolve, reject) => {
          const uploadTask = uploadBytesResumable(originalRef, originalData);
          uploadTask.on('state_changed',
            (snapshot) => onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            reject,
            () => resolve()
          );
        })
      : uploadBytes(originalRef, originalData);

    // 원본 + 썸네일 동시 업로드
    await Promise.all([
      originalUpload,
      uploadBytes(thumbnailRef, thumbnail),
    ]);

    // 다운로드 URL 동시 획득
    const [originalUrl, thumbnailUrl] = await Promise.all([
      getDownloadURL(originalRef),
      getDownloadURL(thumbnailRef),
    ]);

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
 * 여러 이미지 병렬 업로드 (슬라이딩 윈도우 동시성 제한)
 * 하나의 업로드가 끝나면 즉시 다음 파일이 시작됨
 */
export const uploadImages = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<WorkImage[]> => {
  const results: (WorkImage | null)[] = new Array(files.length).fill(null);
  let nextIndex = 0;

  const uploadNext = async (): Promise<void> => {
    while (nextIndex < files.length) {
      const currentIndex = nextIndex++;
      const img = await uploadImage(files[currentIndex], (progress) => {
        onProgress?.(currentIndex, progress);
      });
      results[currentIndex] = { ...img, order: currentIndex };
    }
  };

  // 동시에 UPLOAD_CONCURRENCY개의 워커 시작
  const workers = Array.from(
    { length: Math.min(UPLOAD_CONCURRENCY, files.length) },
    () => uploadNext()
  );

  await Promise.all(workers);

  logger.info('다중 이미지 업로드 완료', {
    action: 'uploadImages',
    count: files.length,
  });

  return results.filter((r): r is WorkImage => r !== null);
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
