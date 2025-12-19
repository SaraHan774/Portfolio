import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { mapFirestoreToWork } from '../../../data/mappers/workMapper';

describe('workMapper', () => {
  describe('mapFirestoreToWork', () => {
    const mockTimestamp = {
      toDate: () => new Date('2024-01-15T10:30:00Z'),
    } as Timestamp;

    it('should map complete Firestore data to Work model', () => {
      const firestoreData = {
        title: 'Test Work',
        year: 2024,
        shortDescription: 'Short desc',
        fullDescription: 'Full desc',
        thumbnailImageId: 'thumb-123',
        images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', thumbnailUrl: 'http://example.com/1-thumb.jpg', order: 0 },
        ],
        videos: [
          { id: 'vid-1', url: 'http://youtube.com/watch?v=abc', type: 'youtube' },
        ],
        caption: 'Test caption',
        sentenceCategoryIds: ['cat-1', 'cat-2'],
        exhibitionCategoryIds: ['ex-1'],
        isPublished: true,
        viewCount: 100,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        publishedAt: mockTimestamp,
      };

      const result = mapFirestoreToWork('work-123', firestoreData);

      expect(result).toEqual({
        id: 'work-123',
        title: 'Test Work',
        year: 2024,
        shortDescription: 'Short desc',
        fullDescription: 'Full desc',
        thumbnailImageId: 'thumb-123',
        images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', thumbnailUrl: 'http://example.com/1-thumb.jpg', order: 0 },
        ],
        videos: [
          { id: 'vid-1', url: 'http://youtube.com/watch?v=abc', type: 'youtube' },
        ],
        caption: 'Test caption',
        sentenceCategoryIds: ['cat-1', 'cat-2'],
        exhibitionCategoryIds: ['ex-1'],
        isPublished: true,
        viewCount: 100,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
        publishedAt: new Date('2024-01-15T10:30:00Z'),
      });
    });

    it('should handle missing optional fields with defaults', () => {
      const minimalData = {
        title: 'Minimal Work',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToWork('work-456', minimalData);

      expect(result.id).toBe('work-456');
      expect(result.title).toBe('Minimal Work');
      expect(result.year).toBeUndefined();
      expect(result.shortDescription).toBeUndefined();
      expect(result.fullDescription).toBeUndefined();
      expect(result.thumbnailImageId).toBe('');
      expect(result.images).toEqual([]);
      expect(result.videos).toEqual([]);
      expect(result.caption).toBeUndefined();
      expect(result.sentenceCategoryIds).toEqual([]);
      expect(result.exhibitionCategoryIds).toEqual([]);
      expect(result.isPublished).toBe(false);
      expect(result.viewCount).toBeUndefined();
      expect(result.publishedAt).toBeUndefined();
    });

    it('should handle empty title with default empty string', () => {
      const dataWithEmptyTitle = {
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToWork('work-789', dataWithEmptyTitle);

      expect(result.title).toBe('');
    });

    it('should handle null timestamps with current date', () => {
      const dataWithNullTimestamps = {
        title: 'Test',
        createdAt: null,
        updatedAt: null,
      };

      const result = mapFirestoreToWork('work-abc', dataWithNullTimestamps);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should preserve image order', () => {
      const dataWithImages = {
        title: 'Test',
        images: [
          { id: 'img-3', url: 'url3', thumbnailUrl: 'thumb3', order: 2 },
          { id: 'img-1', url: 'url1', thumbnailUrl: 'thumb1', order: 0 },
          { id: 'img-2', url: 'url2', thumbnailUrl: 'thumb2', order: 1 },
        ],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToWork('work-img', dataWithImages);

      expect(result.images).toHaveLength(3);
      expect(result.images[0].order).toBe(2);
      expect(result.images[1].order).toBe(0);
      expect(result.images[2].order).toBe(1);
    });

    it('should handle boolean isPublished correctly', () => {
      const publishedData = {
        title: 'Published Work',
        isPublished: true,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const unpublishedData = {
        title: 'Unpublished Work',
        isPublished: false,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      expect(mapFirestoreToWork('pub-1', publishedData).isPublished).toBe(true);
      expect(mapFirestoreToWork('pub-2', unpublishedData).isPublished).toBe(false);
    });

    it('should handle viewCount as number', () => {
      const dataWithViewCount = {
        title: 'Test',
        viewCount: 42,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToWork('view-1', dataWithViewCount);

      expect(result.viewCount).toBe(42);
    });

    it('should handle empty arrays for category IDs', () => {
      const dataWithEmptyCategories = {
        title: 'Test',
        sentenceCategoryIds: [],
        exhibitionCategoryIds: [],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToWork('cat-empty', dataWithEmptyCategories);

      expect(result.sentenceCategoryIds).toEqual([]);
      expect(result.exhibitionCategoryIds).toEqual([]);
    });
  });
});
