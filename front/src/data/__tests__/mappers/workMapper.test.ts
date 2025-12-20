// Tests for work mapper

import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  mapFirestoreToWork,
  filterPublishedWorks,
  sortByPublishedDate,
} from '../../mappers/workMapper';
import type { Work } from '@/core/types';

describe('workMapper', () => {
  describe('mapFirestoreToWork', () => {
    it('should map complete Firestore data to Work type', () => {
      const id = 'work-1';
      const firestoreData = {
        title: 'Test Work',
        year: 2024,
        shortDescription: 'Short desc',
        fullDescription: 'Full description',
        thumbnailImageId: 'img-1',
        images: [{ id: 'img-1', url: 'test.jpg', thumbnailUrl: 'thumb.jpg', order: 0, width: 800, height: 600 }],
        videos: [],
        caption: 'Test caption',
        sentenceCategoryIds: ['cat-1'],
        exhibitionCategoryIds: ['ex-1'],
        isPublished: true,
        viewCount: 10,
        createdAt: Timestamp.fromDate(new Date('2024-01-01')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02')),
        publishedAt: Timestamp.fromDate(new Date('2024-01-03')),
      };

      const result = mapFirestoreToWork(id, firestoreData);

      expect(result.id).toBe(id);
      expect(result.title).toBe('Test Work');
      expect(result.year).toBe(2024);
      expect(result.shortDescription).toBe('Short desc');
      expect(result.isPublished).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields', () => {
      const id = 'work-2';
      const firestoreData = {
        title: 'Minimal Work',
        fullDescription: 'Description',
        thumbnailImageId: 'img-1',
        images: [],
        sentenceCategoryIds: [],
        exhibitionCategoryIds: [],
        isPublished: false,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const result = mapFirestoreToWork(id, firestoreData);

      expect(result.id).toBe(id);
      expect(result.title).toBe('Minimal Work');
      expect(result.year).toBeUndefined();
      expect(result.shortDescription).toBeUndefined();
      expect(result.caption).toBeUndefined();
      expect(result.videos).toEqual([]);
    });

    it('should handle empty or malformed data', () => {
      const id = 'work-3';
      const firestoreData = {};

      const result = mapFirestoreToWork(id, firestoreData);

      expect(result.id).toBe(id);
      expect(result.title).toBe('');
      expect(result.fullDescription).toBe('');
      expect(result.images).toEqual([]);
      expect(result.sentenceCategoryIds).toEqual([]);
      expect(result.exhibitionCategoryIds).toEqual([]);
      expect(result.isPublished).toBe(false);
    });
  });

  describe('filterPublishedWorks', () => {
    it('should filter only published works', () => {
      const works: Work[] = [
        { id: '1', isPublished: true } as Work,
        { id: '2', isPublished: false } as Work,
        { id: '3', isPublished: true } as Work,
      ];

      const result = filterPublishedWorks(works);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should return empty array when no published works', () => {
      const works: Work[] = [
        { id: '1', isPublished: false } as Work,
        { id: '2', isPublished: false } as Work,
      ];

      const result = filterPublishedWorks(works);

      expect(result).toHaveLength(0);
    });
  });

  describe('sortByPublishedDate', () => {
    it('should sort works by published date descending', () => {
      const works: Work[] = [
        { id: '1', publishedAt: new Date('2024-01-01') } as Work,
        { id: '2', publishedAt: new Date('2024-03-01') } as Work,
        { id: '3', publishedAt: new Date('2024-02-01') } as Work,
      ];

      const result = sortByPublishedDate(works);

      expect(result[0].id).toBe('2'); // Latest first
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1');
    });

    it('should handle works without publishedAt', () => {
      const works: Work[] = [
        { id: '1', publishedAt: new Date('2024-01-01') } as Work,
        { id: '2', publishedAt: undefined } as Work,
        { id: '3', publishedAt: new Date('2024-02-01') } as Work,
      ];

      const result = sortByPublishedDate(works);

      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('2'); // undefined should be last
    });

    it('should not mutate original array', () => {
      const works: Work[] = [
        { id: '1', publishedAt: new Date('2024-01-01') } as Work,
        { id: '2', publishedAt: new Date('2024-02-01') } as Work,
      ];

      const original = [...works];
      sortByPublishedDate(works);

      expect(works).toEqual(original);
    });
  });
});
