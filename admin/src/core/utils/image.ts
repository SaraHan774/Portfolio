// 이미지 관련 순수 유틸리티 함수
import type { ImageResizeOptions, ImageDimensions } from '../types';

/**
 * 이미지 리사이즈 (클라이언트 사이드)
 * 비율을 유지하며 최대 크기 이내로 리사이즈
 */
export const resizeImage = (
  file: File,
  options: ImageResizeOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;
      const { maxWidth, maxHeight, quality = 0.8 } = options;

      // 비율 유지하며 리사이즈
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('이미지 변환 실패'));
            }
          },
          'image/jpeg',
          quality
        );
      } else {
        reject(new Error('Canvas context 생성 실패'));
      }

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('이미지 로드 실패'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 이미지 크기 정보 가져오기
 */
export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('이미지 크기 정보 로드 실패'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 파일 확장자 추출
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * URL에서 파일 확장자 추출
 */
export const getExtensionFromUrl = (url: string): string => {
  const pathPart = url.split('?')[0];
  return getFileExtension(pathPart);
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
  const defaultTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const types = allowedTypes || defaultTypes;
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
