// Mapper for transforming Firestore data to Work domain types

import { Timestamp } from 'firebase/firestore';
import type { Work, WorkImage, WorkVideo } from '@/core/types';

/**
 * Map Firestore document data to Work type
 */
export const mapFirestoreToWork = (id: string, data: Record<string, unknown>): Work => ({
  id,
  title: (data.title as string) || '',
  year: data.year as number | undefined,
  shortDescription: data.shortDescription as string | undefined,
  fullDescription: (data.fullDescription as string) || '',
  thumbnailImageId: (data.thumbnailImageId as string) || '',
  images: (data.images as WorkImage[]) || [],
  videos: (data.videos as WorkVideo[]) || [],
  caption: data.caption as string | undefined,
  sentenceCategoryIds: (data.sentenceCategoryIds as string[]) || [],
  exhibitionCategoryIds: (data.exhibitionCategoryIds as string[]) || [],
  isPublished: (data.isPublished as boolean) || false,
  viewCount: data.viewCount as number | undefined,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  publishedAt: (data.publishedAt as Timestamp)?.toDate() || undefined,
});

/**
 * Filter published works from a list
 */
export const filterPublishedWorks = (works: Work[]): Work[] => {
  return works.filter((work) => work.isPublished);
};

/**
 * Sort works by published date (descending)
 */
export const sortByPublishedDate = (works: Work[]): Work[] => {
  return [...works].sort((a, b) => {
    const dateA = a.publishedAt?.getTime() || 0;
    const dateB = b.publishedAt?.getTime() || 0;
    return dateB - dateA;
  });
};