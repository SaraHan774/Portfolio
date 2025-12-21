// Custom hook for thumbnail URL calculation logic

import { useMemo } from 'react';
import type { Work } from '@/types';

/**
 * Calculate thumbnail URL from work data
 * Priority: thumbnailImageId > first image > YouTube thumbnail > undefined
 *
 * @param work - Work object containing images and videos
 * @returns Thumbnail URL or undefined if no media exists
 */
export const useThumbnailUrl = (work: Work | undefined): string | undefined => {
  return useMemo(() => {
    if (!work) {
      return undefined;
    }

    // Try to find image with thumbnailImageId
    const thumbnailImage =
      work.images?.find((img) => img.id === work.thumbnailImageId) ||
      work.images?.[0];

    if (thumbnailImage) {
      return thumbnailImage.thumbnailUrl || thumbnailImage.url;
    }

    // Fallback to YouTube thumbnail if no images
    const firstVideo = work.videos?.[0];
    const youtubeVideoId = firstVideo?.youtubeVideoId
      ?.split('?')[0]
      ?.split('&')[0];

    if (youtubeVideoId) {
      return `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
    }

    return undefined;
  }, [work]);
};

/**
 * Get thumbnail URL from work object (non-hook version)
 * Useful for utility functions and non-component contexts
 *
 * @param work - Work object containing images and videos
 * @returns Thumbnail URL or undefined if no media exists
 */
export const getThumbnailUrl = (work: Work | undefined): string | undefined => {
  if (!work) {
    return undefined;
  }

  // Try to find image with thumbnailImageId
  const thumbnailImage =
    work.images?.find((img) => img.id === work.thumbnailImageId) ||
    work.images?.[0];

  if (thumbnailImage) {
    return thumbnailImage.thumbnailUrl || thumbnailImage.url;
  }

  // Fallback to YouTube thumbnail if no images
  const firstVideo = work.videos?.[0];
  const youtubeVideoId = firstVideo?.youtubeVideoId
    ?.split('?')[0]
    ?.split('&')[0];

  if (youtubeVideoId) {
    return `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
  }

  return undefined;
};
