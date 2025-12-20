// Mapper for transforming Firestore data to Category domain types

import { Timestamp } from 'firebase/firestore';
import type {
  SentenceCategory,
  ExhibitionCategory,
  KeywordCategory,
  WorkOrder,
} from '@/core/types';

/**
 * Map Firestore document data to SentenceCategory type
 */
export const mapFirestoreToSentenceCategory = (
  id: string,
  data: Record<string, unknown>
): SentenceCategory => ({
  id,
  sentence: (data.sentence as string) || '',
  keywords: (data.keywords as KeywordCategory[]) || [],
  displayOrder: (data.displayOrder as number) || 0,
  isActive: (data.isActive as boolean) ?? true,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

/**
 * Map Firestore document data to ExhibitionCategory type
 */
export const mapFirestoreToExhibitionCategory = (
  id: string,
  data: Record<string, unknown>
): ExhibitionCategory => ({
  id,
  title: (data.title as string) || '',
  description: (data.description as ExhibitionCategory['description']) || {
    exhibitionType: '',
    venue: '',
    year: new Date().getFullYear(),
  },
  displayOrder: (data.displayOrder as number) || 0,
  workOrders: (data.workOrders as WorkOrder[]) || [],
  isActive: (data.isActive as boolean) ?? true,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

/**
 * Filter active categories
 */
export const filterActiveCategories = <T extends { isActive: boolean }>(
  categories: T[]
): T[] => {
  return categories.filter((category) => category.isActive);
};

/**
 * Sort categories by display order
 */
export const sortByDisplayOrder = <T extends { displayOrder: number }>(
  categories: T[]
): T[] => {
  return [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
};

/**
 * Find keyword by ID across all sentence categories
 */
export const findKeywordById = (
  categories: SentenceCategory[],
  keywordId: string
): KeywordCategory | null => {
  for (const category of categories) {
    const keyword = category.keywords.find((k) => k.id === keywordId);
    if (keyword) {
      return keyword;
    }
  }
  return null;
};

/**
 * Find sentence category containing a specific keyword
 */
export const findSentenceCategoryByKeywordId = (
  categories: SentenceCategory[],
  keywordId: string
): SentenceCategory | null => {
  return (
    categories.find((category) =>
      category.keywords.some((k) => k.id === keywordId)
    ) || null
  );
};