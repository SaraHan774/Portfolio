// 이미지 관련 순수 유틸리티 함수
import type { ImageResizeOptions, ImageDimensions } from '../types';

/** Default allowed image MIME types */
const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * 이미지 리사이즈 (클라이언트 사이드)
 * 비율을 유지하며 최대 크기 이내로 리사이즈
 *
 * @throws Error if file type is invalid or processing fails
 */
export const resizeImage = (
  file: File,
  options: ImageResizeOptions
): Promise<Blob> => {
  // Validate file type before processing
  if (!DEFAULT_IMAGE_TYPES.includes(file.type)) {
    return Promise.reject(new Error(`지원하지 않는 이미지 형식입니다: ${file.type}`));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    // Cleanup function to prevent memory leaks
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        let { width, height } = img;
        const { maxWidth, maxHeight, quality = 0.8 } = options;

        // 비율 유지하며 리사이즈
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas context 생성 실패'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('이미지 변환 실패'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error('이미지 처리 중 오류 발생'));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('이미지 로드 실패'));
    };

    img.src = objectUrl;
  });
};

/**
 * 이미지 크기 정보 가져오기
 */
export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };
      cleanup();
      resolve(dimensions);
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('이미지 크기 정보 로드 실패'));
    };

    img.src = objectUrl;
  });
};

/**
 * 파일 확장자 추출
 * Returns empty string if no extension found
 */
export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * URL에서 파일 확장자 추출
 * Extracts the filename from the URL path, then gets its extension
 */
export const getExtensionFromUrl = (url: string): string => {
  const pathPart = url.split('?')[0];
  const filename = pathPart.split('/').pop() || '';
  return getFileExtension(filename);
};

/**
 * 파일 크기 포맷팅
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 이미지 파일 타입 검증
 */
export const isValidImageType = (file: File, allowedTypes?: string[]): boolean => {
  const types = allowedTypes || DEFAULT_IMAGE_TYPES;
  return types.includes(file.type);
};

/**
 * 이미지 파일 크기 검증
 */
export const isValidFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

/**
 * 이미지 종횡비 계산
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * 종횡비에 맞는 크기 계산
 */
export const calculateDimensionsForAspectRatio = (
  targetWidth: number,
  aspectRatio: number
): ImageDimensions => {
  return {
    width: targetWidth,
    height: Math.round(targetWidth / aspectRatio),
  };
};
