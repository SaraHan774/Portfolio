// Thumbnail utility functions

import type { Work, WorkImage, WorkVideo } from '@/types';

/**
 * Get thumbnail URL from work
 * Priority: thumbnailImageId > first image > YouTube thumbnail
 */
export const getThumbnailUrl = (work: Work): string | null => {
  // Try to find the designated thumbnail image
  const thumbnailImage =
    work.images?.find((img) => img.id === work.thumbnailImageId) ||
    work.images?.[0];

  if (thumbnailImage) {
    return thumbnailImage.thumbnailUrl || thumbnailImage.url;
  }

  // Fallback to YouTube thumbnail
  const firstVideo = work.videos?.[0];
  if (firstVideo) {
    return getYouTubeThumbnailUrl(firstVideo);
  }

  return null;
};

/**
 * Extract YouTube video ID and get thumbnail URL
 */
export const getYouTubeThumbnailUrl = (
  video: WorkVideo
): string | null => {
  const videoId = video.youtubeVideoId?.split('?')[0]?.split('&')[0];
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;
};

/**
 * Check if work has any thumbnail
 */
export const hasThumbnail = (work: Work): boolean => {
  return getThumbnailUrl(work) !== null;
};

/**
 * Get thumbnail from image
 */
export const getImageThumbnailUrl = (image: WorkImage): string => {
  return image.thumbnailUrl || image.url;
};
