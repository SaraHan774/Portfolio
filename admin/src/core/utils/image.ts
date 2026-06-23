// 이미지 관련 순수 유틸리티 함수
import type { ImageResizeOptions, ImageDimensions } from '../types';

/** processImage()에서 생성할 변형 옵션 */
export interface ProcessImageVariant {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

/** processImage() 입력 옵션 */
export interface ProcessImageOptions {
  thumbnail: ProcessImageVariant;
  medium?: ProcessImageVariant;
  original?: ProcessImageVariant;
}

/** processImage() 결과 */
export interface ProcessImageResult {
  dimensions: ImageDimensions;
  thumbnail: Blob;
  medium?: Blob;
  original?: Blob;
  /**
   * LQIP 블러 플레이스홀더 (base64 data URL, 가로 ~20px).
   * 생성 실패 시 빈 문자열.
   */
  blurDataURL: string;
}

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
 * WebP를 지원하는지 한 번만 확인하여 캐시
 */
let _supportsWebP: boolean | null = null;
const supportsWebP = (): boolean => {
  if (_supportsWebP !== null) return _supportsWebP;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  _supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return _supportsWebP;
};

/** WebP 가능하면 WebP, 아니면 JPEG 사용 */
const getOutputMimeType = (): string =>
  supportsWebP() ? 'image/webp' : 'image/jpeg';

/** 압축 변형에 사용할 파일 확장자 반환 */
export const getOutputExtension = (): string =>
  supportsWebP() ? 'webp' : 'jpg';

/**
 * 캔버스에서 지정 크기로 리사이즈된 Blob 생성 (내부 헬퍼)
 * WebP를 지원하는 브라우저에서는 WebP로 출력 (~30% 더 작음)
 */
const canvasToBlob = (
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    let { width, height } = img;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context 생성 실패'));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('이미지 변환 실패'));
      },
      getOutputMimeType(),
      quality
    );
  });
};

/** LQIP 블러 플레이스홀더 가로 기준(px) */
const LQIP_WIDTH = 20;
/** LQIP data URL 길이 상한 — Firestore 인라인 저장 부담 방지 (~2KB) */
const LQIP_MAX_DATAURL_LENGTH = 2048;
/** 상한 초과 시 재시도할 (가로, 품질) 조합 */
const LQIP_FALLBACK_STEPS: ReadonlyArray<{ width: number; quality: number }> = [
  { width: 16, quality: 0.4 },
  { width: 12, quality: 0.3 },
];

/**
 * LQIP 블러 플레이스홀더(base64 data URL)를 생성한다.
 * - 가로 ~20px(비율 유지)로 축소 후 WebP(미지원 시 JPEG)로 인코딩.
 * - data URL 길이가 상한을 초과하면 가로·품질을 낮춰 재시도.
 * - 끝까지 상한을 못 맞추거나 오류가 나면 빈 문자열 반환(graceful, throw 금지).
 */
const generateBlurDataURL = (img: HTMLImageElement): string => {
  const mimeType = supportsWebP() ? 'image/webp' : 'image/jpeg';

  const encode = (targetWidth: number, quality: number): string => {
    const srcWidth = img.width || targetWidth;
    const srcHeight = img.height || targetWidth;
    const ratio = targetWidth / srcWidth;
    const width = Math.max(1, Math.round(srcWidth * ratio));
    const height = Math.max(1, Math.round(srcHeight * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL(mimeType, quality);
  };

  try {
    let dataURL = encode(LQIP_WIDTH, 0.5);
    if (dataURL.length <= LQIP_MAX_DATAURL_LENGTH) return dataURL;

    for (const step of LQIP_FALLBACK_STEPS) {
      dataURL = encode(step.width, step.quality);
      if (dataURL.length <= LQIP_MAX_DATAURL_LENGTH) return dataURL;
    }

    // 끝까지 상한을 못 맞추면 생성 실패로 처리
    return '';
  } catch {
    return '';
  }
};

/** 백필 시 원격 이미지 로드 타임아웃 (ms) */
const BACKFILL_LOAD_TIMEOUT_MS = 15000;

/**
 * 이미 업로드된 이미지 URL로부터 LQIP 블러 data URL을 생성한다 (기존 데이터 백필용).
 *
 * - `crossOrigin='anonymous'`로 로드해 Canvas에서 픽셀을 읽는다.
 *   → 대상 버킷(Firebase Storage)에 CORS 설정이 되어 있어야 한다.
 *     미설정 시 tainted canvas가 되어 `toDataURL`이 실패하고 빈 문자열을 반환한다.
 * - 로드 실패 / 타임아웃 / CORS 오류 / 인코딩 실패는 모두 빈 문자열 반환(graceful, throw 금지).
 *
 * @param url 원본(또는 썸네일) 이미지 URL
 */
export const generateBlurDataURLFromUrl = (
  url: string,
  timeoutMs: number = BACKFILL_LOAD_TIMEOUT_MS
): Promise<string> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    let settled = false;
    const finish = (value: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => finish(''), timeoutMs);

    img.onload = () => {
      try {
        finish(generateBlurDataURL(img));
      } catch {
        finish('');
      }
    };
    img.onerror = () => finish('');
    img.src = url;
  });
};

/**
 * 이미지를 한 번만 디코딩하여 dimensions + 여러 변형을 한꺼번에 생성
 */
export const processImage = (
  file: File,
  options: ProcessImageOptions
): Promise<ProcessImageResult> => {
  if (!DEFAULT_IMAGE_TYPES.includes(file.type)) {
    return Promise.reject(new Error(`지원하지 않는 이미지 형식입니다: ${file.type}`));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = async () => {
      try {
        const dimensions: ImageDimensions = { width: img.width, height: img.height };

        const thumbnail = await canvasToBlob(
          img,
          options.thumbnail.maxWidth,
          options.thumbnail.maxHeight,
          options.thumbnail.quality
        );

        let medium: Blob | undefined;
        if (options.medium) {
          medium = await canvasToBlob(
            img,
            options.medium.maxWidth,
            options.medium.maxHeight,
            options.medium.quality
          );
        }

        let original: Blob | undefined;
        if (options.original) {
          // 원본이 이미 작으면 리사이즈하지 않음
          if (img.width > options.original.maxWidth || img.height > options.original.maxHeight) {
            original = await canvasToBlob(
              img,
              options.original.maxWidth,
              options.original.maxHeight,
              options.original.quality
            );
          }
        }

        // LQIP 블러 플레이스홀더 생성 (실패해도 빈 문자열로 graceful)
        const blurDataURL = generateBlurDataURL(img);

        cleanup();
        resolve({ dimensions, thumbnail, medium, original, blurDataURL });
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
