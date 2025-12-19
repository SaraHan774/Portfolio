/**
 * Storage Domain Hook - 파일 업로드/삭제 관련 비즈니스 로직
 * Repository 레이어를 통해 데이터 접근
 */
import { useState, useCallback } from 'react';
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

  // 전체 진행률 계산
  const totalProgress =
    Object.keys(progressMap).length > 0
      ? Object.values(progressMap).reduce((sum, p) => sum + p, 0) / Object.keys(progressMap).length
      : 0;

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
 */
export const useImageManager = () => {
  const uploadSingle = useUploadImage();
  const uploadMultiple = useUploadImages();
  const deleteSingle = useDeleteImage();
  const deleteMultiple = useDeleteWorkImages();

  const [images, setImages] = useState<WorkImage[]>([]);

  // 이미지 추가
  const addImage = useCallback(async (file: File) => {
    const newImage = await uploadSingle.mutateAsync(file);
    setImages((prev) => [...prev, newImage]);
    return newImage;
  }, [uploadSingle]);

  // 여러 이미지 추가
  const addImages = useCallback(async (files: File[]) => {
    const newImages = await uploadMultiple.mutateAsync(files);
    setImages((prev) => [...prev, ...newImages]);
    return newImages;
  }, [uploadMultiple]);

  // 이미지 제거
  const removeImage = useCallback(async (imageId: string, extension?: string) => {
    await deleteSingle.mutateAsync({ imageId, extension });
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }, [deleteSingle]);

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
    isUploading: uploadSingle.isPending || uploadMultiple.isPending,
    isDeleting: deleteSingle.isPending || deleteMultiple.isPending,
    uploadProgress: uploadMultiple.totalProgress || uploadSingle.progress,
  };
};
