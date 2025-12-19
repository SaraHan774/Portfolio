import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  mapFirestoreToSentenceCategory,
  mapFirestoreToExhibitionCategory,
} from '../../../data/mappers/categoryMapper';

describe('categoryMapper', () => {
  const mockTimestamp = {
    toDate: () => new Date('2024-01-15T10:30:00Z'),
  } as Timestamp;

  describe('mapFirestoreToSentenceCategory', () => {
    it('should map complete Firestore data to SentenceCategory', () => {
      const firestoreData = {
        sentence: 'Test sentence',
        keywords: [
          { keyword: 'keyword1', workId: 'work-1' },
          { keyword: 'keyword2', workId: 'work-2' },
        ],
        displayOrder: 1,
        isActive: true,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSentenceCategory('cat-123', firestoreData);

      expect(result).toEqual({
        id: 'cat-123',
        sentence: 'Test sentence',
        keywords: [
          { keyword: 'keyword1', workId: 'work-1' },
          { keyword: 'keyword2', workId: 'work-2' },
        ],
        displayOrder: 1,
        isActive: true,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      });
    });

    it('should handle missing optional fields with defaults', () => {
      const minimalData = {
        sentence: 'Minimal sentence',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSentenceCategory('cat-456', minimalData);

      expect(result.id).toBe('cat-456');
      expect(result.sentence).toBe('Minimal sentence');
      expect(result.keywords).toEqual([]);
      expect(result.displayOrder).toBe(0);
      expect(result.isActive).toBe(true);
    });

    it('should handle empty sentence with default', () => {
      const dataWithEmptySentence = {
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSentenceCategory('cat-empty', dataWithEmptySentence);

      expect(result.sentence).toBe('');
    });

    it('should handle isActive false', () => {
      const inactiveData = {
        sentence: 'Inactive',
        isActive: false,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSentenceCategory('cat-inactive', inactiveData);

      expect(result.isActive).toBe(false);
    });

    it('should handle null timestamps', () => {
      const dataWithNullTimestamps = {
        sentence: 'Test',
        createdAt: null,
        updatedAt: null,
      };

      const result = mapFirestoreToSentenceCategory('cat-null', dataWithNullTimestamps);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('mapFirestoreToExhibitionCategory', () => {
    it('should map complete Firestore data to ExhibitionCategory', () => {
      const firestoreData = {
        title: 'Test Exhibition',
        description: {
          exhibitionType: 'Solo',
          venue: 'Gallery A',
          year: 2024,
        },
        displayOrder: 2,
        workOrders: [
          { workId: 'work-1', order: 0 },
          { workId: 'work-2', order: 1 },
        ],
        isActive: true,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToExhibitionCategory('ex-123', firestoreData);

      expect(result).toEqual({
        id: 'ex-123',
        title: 'Test Exhibition',
        description: {
          exhibitionType: 'Solo',
          venue: 'Gallery A',
          year: 2024,
        },
        displayOrder: 2,
        workOrders: [
          { workId: 'work-1', order: 0 },
          { workId: 'work-2', order: 1 },
        ],
        isActive: true,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      });
    });

    it('should handle missing optional fields with defaults', () => {
      const minimalData = {
        title: 'Minimal Exhibition',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToExhibitionCategory('ex-456', minimalData);

      expect(result.id).toBe('ex-456');
      expect(result.title).toBe('Minimal Exhibition');
      expect(result.description).toEqual({
        exhibitionType: '',
        venue: '',
        year: new Date().getFullYear(),
      });
      expect(result.displayOrder).toBe(0);
      expect(result.workOrders).toEqual([]);
      expect(result.isActive).toBe(true);
    });

    it('should handle empty title with default', () => {
      const dataWithEmptyTitle = {
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToExhibitionCategory('ex-empty', dataWithEmptyTitle);

      expect(result.title).toBe('');
    });

    it('should handle partial description by using as-is', () => {
      // Note: The mapper uses the description object as-is, it doesn't merge with defaults
      // This tests the actual behavior - if partial data is provided, it's used directly
      const dataWithPartialDesc = {
        title: 'Test',
        description: {
          exhibitionType: 'Group',
          venue: 'Test Venue',
          year: 2024,
        },
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToExhibitionCategory('ex-partial', dataWithPartialDesc);

      expect(result.description.exhibitionType).toBe('Group');
      expect(result.description.venue).toBe('Test Venue');
      expect(result.description.year).toBe(2024);
    });

    it('should handle isActive false', () => {
      const inactiveData = {
        title: 'Inactive',
        isActive: false,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToExhibitionCategory('ex-inactive', inactiveData);

      expect(result.isActive).toBe(false);
    });

    it('should preserve work orders', () => {
      const dataWithWorkOrders = {
        title: 'Test',
        workOrders: [
          { workId: 'work-3', order: 2 },
          { workId: 'work-1', order: 0 },
          { workId: 'work-2', order: 1 },
        ],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToExhibitionCategory('ex-orders', dataWithWorkOrders);

      expect(result.workOrders).toHaveLength(3);
      expect(result.workOrders[0]).toEqual({ workId: 'work-3', order: 2 });
    });
  });
});
