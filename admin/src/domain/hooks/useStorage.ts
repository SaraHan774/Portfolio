/**
 * Storage Domain Hook - 파일 업로드/삭제 관련 비즈니스 로직
 * Repository 레이어를 통해 데이터 접근
 */
import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  uploadImage,
  uploadImages,
  deleteImage,
  deleteWorkImages,
} from '../../data/repository';
import type { WorkImage } from '../../core/types';

// Note: Progress tracking is handled via callback parameters in upload functions

/**
 * 단일 이미지 업로드 Hook
 */
export const useUploadImage = () => {
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (file: File) => uploadImage(file, setProgress),
    onSettled: () => setProgress(0),
  });

  return {
    ...mutation,
    progress,
  };
};

/**
 * 다중 이미지 업로드 Hook
 */
export const useUploadImages = () => {
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});

  const handleProgress = useCallback((fileIndex: number, progress: number) => {
    setProgressMap((prev) => ({ ...prev, [fileIndex]: progress }));
  }, []);

  const mutation = useMutation({
    mutationFn: (files: File[]) => uploadImages(files, handleProgress),
    onSettled: () => setProgressMap({}),
  });

  // 전체 진행률 계산 (메모이제이션으로 불필요한 재계산 방지)
  const totalProgress = useMemo(() => {
    const keys = Object.keys(progressMap);
    return keys.length > 0
      ? Object.values(progressMap).reduce((sum, p) => sum + p, 0) / keys.length
      : 0;
  }, [progressMap]);

  return {
    ...mutation,
    progressMap,
    totalProgress,
  };
};

/**
 * 이미지 삭제 Hook
 */
export const useDeleteImage = () => {
  return useMutation({
    mutationFn: ({ imageId, extension }: { imageId: string; extension?: string }) =>
      deleteImage(imageId, extension),
  });
};

/**
 * 작품 이미지 일괄 삭제 Hook
 */
export const useDeleteWorkImages = () => {
  return useMutation({
    mutationFn: (images: WorkImage[]) => deleteWorkImages(images),
  });
};

/**
 * 이미지 업로드 및 삭제를 관리하는 통합 Hook
 *
 * @remarks
 * 반환되는 함수들(addImage, addImages, removeImage)은 mutateAsync에 의존합니다.
 * 이 함수들을 다른 훅의 dependency array에 사용할 경우 useCallback으로 감싸거나,
 * 또는 ref를 사용하여 최신 함수를 참조하세요.
 *
 * @example
 * ```tsx
 * const { images, addImage, removeImage, isUploading, uploadError } = useImageManager();
 *
 * const handleUpload = async (file: File) => {
 *   try {
 *     await addImage(file);
 *   } catch (error) {
 *     console.error('Upload failed:', error);
 *   }
 * };
 *
 * // 에러 처리
 * useEffect(() => {
 *   if (uploadError) {
 *     message.error('업로드 실패');
 *   }
 * }, [uploadError]);
 * ```
 */
export const useImageManager = () => {
  const uploadSingleHook = useUploadImage();
  const uploadMultipleHook = useUploadImages();
  const deleteSingleHook = useDeleteImage();
  const deleteMultipleHook = useDeleteWorkImages();

  // mutateAsync 직접 추출하여 안정적인 참조 확보
  const { mutateAsync: uploadSingleAsync } = uploadSingleHook;
  const { mutateAsync: uploadMultipleAsync } = uploadMultipleHook;
  const { mutateAsync: deleteSingleAsync } = deleteSingleHook;

  const [images, setImages] = useState<WorkImage[]>([]);

  // 이미지 추가 (에러 발생 시 상태 변경 없음)
  const addImage = useCallback(async (file: File) => {
    const newImage = await uploadSingleAsync(file);
    setImages((prev) => [...prev, newImage]);
    return newImage;
  }, [uploadSingleAsync]);

  // 여러 이미지 추가 (에러 발생 시 상태 변경 없음)
  const addImages = useCallback(async (files: File[]) => {
    const newImages = await uploadMultipleAsync(files);
    setImages((prev) => [...prev, ...newImages]);
    return newImages;
  }, [uploadMultipleAsync]);

  // 이미지 제거 (에러 발생 시 상태 변경 없음)
  const removeImage = useCallback(async (imageId: string, extension?: string) => {
    await deleteSingleAsync({ imageId, extension });
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }, [deleteSingleAsync]);

  // 이미지 순서 변경
  const reorderImages = useCallback((newOrder: WorkImage[]) => {
    setImages(newOrder.map((img, index) => ({ ...img, order: index })));
  }, []);

  // 초기 이미지 설정
  const initializeImages = useCallback((initialImages: WorkImage[]) => {
    setImages(initialImages);
  }, []);

  // 전체 초기화
  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    images,
    addImage,
    addImages,
    removeImage,
    reorderImages,
    initializeImages,
    clearImages,
    isUploading: uploadSingleHook.isPending || uploadMultipleHook.isPending,
    isDeleting: deleteSingleHook.isPending || deleteMultipleHook.isPending,
    uploadProgress: uploadMultipleHook.totalProgress || uploadSingleHook.progress,
    // 에러 상태 노출 (소비자가 처리할 수 있도록)
    uploadError: uploadSingleHook.error || uploadMultipleHook.error,
    deleteError: deleteSingleHook.error || deleteMultipleHook.error,
  };
};
