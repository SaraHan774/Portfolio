// Tests for category mapper

import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  mapFirestoreToSentenceCategory,
  mapFirestoreToExhibitionCategory,
  filterActiveCategories,
  sortByDisplayOrder,
  findKeywordById,
  findSentenceCategoryByKeywordId,
} from '../../mappers/categoryMapper';
import type { SentenceCategory, ExhibitionCategory } from '@/core/types';

describe('categoryMapper', () => {
  describe('mapFirestoreToSentenceCategory', () => {
    it('should map complete Firestore data to SentenceCategory type', () => {
      const id = 'cat-1';
      const firestoreData = {
        sentence: 'Test sentence',
        keywords: [{ id: 'kw-1', name: 'keyword', startIndex: 0, endIndex: 4, workOrders: [] }],
        displayOrder: 1,
        isActive: true,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const result = mapFirestoreToSentenceCategory(id, firestoreData);

      expect(result.id).toBe(id);
      expect(result.sentence).toBe('Test sentence');
      expect(result.keywords).toHaveLength(1);
      expect(result.displayOrder).toBe(1);
      expect(result.isActive).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const id = 'cat-2';
      const firestoreData = {
        sentence: 'Test',
      };

      const result = mapFirestoreToSentenceCategory(id, firestoreData);

      expect(result.keywords).toEqual([]);
      expect(result.displayOrder).toBe(0);
      expect(result.isActive).toBe(true);
    });
  });

  describe('mapFirestoreToExhibitionCategory', () => {
    it('should map complete Firestore data to ExhibitionCategory type', () => {
      const id = 'ex-1';
      const firestoreData = {
        title: 'Exhibition Title',
        description: {
          exhibitionType: '개인전',
          venue: 'Gallery',
          year: 2024,
        },
        displayOrder: 1,
        workOrders: [{ workId: 'w-1', order: 0 }],
        isActive: true,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const result = mapFirestoreToExhibitionCategory(id, firestoreData);

      expect(result.id).toBe(id);
      expect(result.title).toBe('Exhibition Title');
      expect(result.description.exhibitionType).toBe('개인전');
      expect(result.description.venue).toBe('Gallery');
      expect(result.description.year).toBe(2024);
    });
  });

  describe('filterActiveCategories', () => {
    it('should filter only active categories', () => {
      const categories = [
        { id: '1', isActive: true } as SentenceCategory,
        { id: '2', isActive: false } as SentenceCategory,
        { id: '3', isActive: true } as SentenceCategory,
      ];

      const result = filterActiveCategories(categories);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });
  });

  describe('sortByDisplayOrder', () => {
    it('should sort categories by display order ascending', () => {
      const categories = [
        { id: '1', displayOrder: 3 } as SentenceCategory,
        { id: '2', displayOrder: 1 } as SentenceCategory,
        { id: '3', displayOrder: 2 } as SentenceCategory,
      ];

      const result = sortByDisplayOrder(categories);

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1');
    });

    it('should not mutate original array', () => {
      const categories = [
        { id: '1', displayOrder: 2 } as SentenceCategory,
        { id: '2', displayOrder: 1 } as SentenceCategory,
      ];

      const original = [...categories];
      sortByDisplayOrder(categories);

      expect(categories).toEqual(original);
    });
  });

  describe('findKeywordById', () => {
    it('should find keyword by ID across categories', () => {
      const categories: SentenceCategory[] = [
        {
          id: 'cat-1',
          keywords: [
            { id: 'kw-1', name: 'keyword1', startIndex: 0, endIndex: 8, workOrders: [] },
          ],
        } as SentenceCategory,
        {
          id: 'cat-2',
          keywords: [
            { id: 'kw-2', name: 'keyword2', startIndex: 0, endIndex: 8, workOrders: [] },
          ],
        } as SentenceCategory,
      ];

      const result = findKeywordById(categories, 'kw-2');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('kw-2');
      expect(result?.name).toBe('keyword2');
    });

    it('should return null if keyword not found', () => {
      const categories: SentenceCategory[] = [
        {
          id: 'cat-1',
          keywords: [
            { id: 'kw-1', name: 'keyword1', startIndex: 0, endIndex: 8, workOrders: [] },
          ],
        } as SentenceCategory,
      ];

      const result = findKeywordById(categories, 'kw-999');

      expect(result).toBeNull();
    });
  });

  describe('findSentenceCategoryByKeywordId', () => {
    it('should find sentence category containing keyword', () => {
      const categories: SentenceCategory[] = [
        {
          id: 'cat-1',
          keywords: [
            { id: 'kw-1', name: 'keyword1', startIndex: 0, endIndex: 8, workOrders: [] },
          ],
        } as SentenceCategory,
        {
          id: 'cat-2',
          keywords: [
            { id: 'kw-2', name: 'keyword2', startIndex: 0, endIndex: 8, workOrders: [] },
          ],
        } as SentenceCategory,
      ];

      const result = findSentenceCategoryByKeywordId(categories, 'kw-2');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cat-2');
    });

    it('should return null if category not found', () => {
      const categories: SentenceCategory[] = [
        {
          id: 'cat-1',
          keywords: [
            { id: 'kw-1', name: 'keyword1', startIndex: 0, endIndex: 8, workOrders: [] },
          ],
        } as SentenceCategory,
      ];

      const result = findSentenceCategoryByKeywordId(categories, 'kw-999');

      expect(result).toBeNull();
    });
  });
});
