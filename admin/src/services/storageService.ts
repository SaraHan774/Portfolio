// Firebase Storage 서비스
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from '../config/firebase';
import type { WorkImage } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 이미지 업로드 경로 설정
const WORKS_IMAGES_PATH = 'works/images';
const THUMBNAILS_PATH = 'works/thumbnails';

// 이미지 리사이즈 옵션
interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

// 이미지 리사이즈 (클라이언트 사이드)
const resizeImage = (
  file: File,
  options: ResizeOptions
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
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(file);
  });
};

// 이미지 업로드 (진행률 콜백 포함)
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<WorkImage> => {
  const imageId = uuidv4();
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${imageId}.${extension}`;

  // 원본 이미지 업로드
  const originalRef = ref(storage, `${WORKS_IMAGES_PATH}/${fileName}`);

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
  const thumbnailRef = ref(storage, `${THUMBNAILS_PATH}/${fileName}`);
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

// 이미지 크기 정보 가져오기
const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('이미지 크기 정보 로드 실패'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
};

// 여러 이미지 업로드
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

// 이미지 삭제
export const deleteImage = async (imageId: string, extension = 'jpg'): Promise<void> => {
  const fileName = `${imageId}.${extension}`;

  // 원본 삭제
  try {
    const originalRef = ref(storage, `${WORKS_IMAGES_PATH}/${fileName}`);
    await deleteObject(originalRef);
  } catch {
    console.warn(`원본 이미지 삭제 실패: ${fileName}`);
  }

  // 썸네일 삭제
  try {
    const thumbnailRef = ref(storage, `${THUMBNAILS_PATH}/${fileName}`);
    await deleteObject(thumbnailRef);
  } catch {
    console.warn(`썸네일 이미지 삭제 실패: ${fileName}`);
  }
};

// 여러 이미지 삭제
export const deleteImages = async (imageIds: string[]): Promise<void> => {
  await Promise.all(imageIds.map((id) => deleteImage(id)));
};

// 작업의 모든 이미지 삭제
export const deleteWorkImages = async (images: WorkImage[]): Promise<void> => {
  await Promise.all(
    images.map((image) => {
      const extension = image.url.split('.').pop()?.split('?')[0] || 'jpg';
      return deleteImage(image.id, extension);
    })
  );
};

// 작업 폴더의 모든 이미지 목록 조회
export const listWorkImages = async (): Promise<string[]> => {
  const imagesRef = ref(storage, WORKS_IMAGES_PATH);
  const result = await listAll(imagesRef);
  return result.items.map((item) => item.name);
};

// 이미지 URL로부터 다운로드 URL 가져오기 (캐시된 URL 갱신 필요 시)
export const refreshImageUrl = async (path: string): Promise<string> => {
  const imageRef = ref(storage, path);
  return getDownloadURL(imageRef);
};
