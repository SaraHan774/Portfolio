import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import {
  getPublishedWorks,
  getWorkById,
  getWorksByIds,
} from '@/lib/services/worksService';
import type { Work, WorkImage } from '@/types';

// Get mocked functions
const mockCollection = vi.mocked(collection);
const mockDoc = vi.mocked(doc);
const mockGetDocs = vi.mocked(getDocs);
const mockGetDoc = vi.mocked(getDoc);
const mockQuery = vi.mocked(query);
const mockOrderBy = vi.mocked(orderBy);
const mockWhere = vi.mocked(where);

const mockImage: WorkImage = {
  id: 'img-001',
  url: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  order: 0,
  width: 800,
  height: 600,
};

const mockWorkData = {
  title: 'Test Work',
  year: 2024,
  fullDescription: 'Test description',
  thumbnailImageId: 'img-001',
  images: [mockImage],
  videos: [],
  sentenceCategoryIds: ['cat-001'],
  exhibitionCategoryIds: ['ex-001'],
  isPublished: true,
  createdAt: { toDate: () => new Date('2024-01-01') },
  updatedAt: { toDate: () => new Date('2024-01-01') },
  publishedAt: { toDate: () => new Date('2024-01-01') },
};

const createMockDocSnapshot = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  exists: () => exists,
  data: () => data,
});

const createMockQuerySnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  docs: docs.map((doc) => ({
    id: doc.id,
    data: () => doc.data,
  })),
});

describe('worksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    mockCollection.mockReturnValue('worksCollection' as never);
    mockDoc.mockReturnValue('docRef' as never);
    mockQuery.mockReturnValue('query' as never);
    mockOrderBy.mockReturnValue('orderBy' as never);
    mockWhere.mockReturnValue('where' as never);
  });

  describe('getPublishedWorks', () => {
    it('should fetch all published works', async () => {
      const mockSnapshot = createMockQuerySnapshot([
        { id: 'work-001', data: mockWorkData },
        { id: 'work-002', data: { ...mockWorkData, title: 'Work 2' } },
      ]);

      mockGetDocs.mockResolvedValue(mockSnapshot as never);

      const works = await getPublishedWorks();

      expect(mockCollection).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('isPublished', '==', true);
      expect(mockOrderBy).toHaveBeenCalledWith('publishedAt', 'desc');
      expect(works).toHaveLength(2);
      expect(works[0].id).toBe('work-001');
      expect(works[0].title).toBe('Test Work');
      expect(works[1].id).toBe('work-002');
    });

    it('should return empty array when no works exist', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      mockGetDocs.mockResolvedValue(mockSnapshot as never);

      const works = await getPublishedWorks();

      expect(works).toHaveLength(0);
    });

    it('should handle missing optional fields', async () => {
      const minimalWorkData = {
        title: 'Minimal Work',
        isPublished: true,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      const mockSnapshot = createMockQuerySnapshot([
        { id: 'work-001', data: minimalWorkData },
      ]);

      mockGetDocs.mockResolvedValue(mockSnapshot as never);

      const works = await getPublishedWorks();

      expect(works[0].images).toEqual([]);
      expect(works[0].sentenceCategoryIds).toEqual([]);
      expect(works[0].exhibitionCategoryIds).toEqual([]);
    });
  });

  describe('getWorkById', () => {
    it('should fetch a single work by id', async () => {
      const mockDocSnap = createMockDocSnapshot('work-001', mockWorkData);
      mockGetDoc.mockResolvedValue(mockDocSnap as never);

      const work = await getWorkById('work-001');

      expect(mockDoc).toHaveBeenCalled();
      expect(work).not.toBeNull();
      expect(work?.id).toBe('work-001');
      expect(work?.title).toBe('Test Work');
    });

    it('should return null when work does not exist', async () => {
      const mockDocSnap = createMockDocSnapshot('invalid-id', {}, false);
      mockGetDoc.mockResolvedValue(mockDocSnap as never);

      const work = await getWorkById('invalid-id');

      expect(work).toBeNull();
    });

    it('should return null for unpublished works', async () => {
      const unpublishedData = { ...mockWorkData, isPublished: false };
      const mockDocSnap = createMockDocSnapshot('work-001', unpublishedData);
      mockGetDoc.mockResolvedValue(mockDocSnap as never);

      const work = await getWorkById('work-001');

      expect(work).toBeNull();
    });
  });

  describe('getWorksByIds', () => {
    it('should return empty array for empty input', async () => {
      const works = await getWorksByIds([]);

      expect(works).toEqual([]);
      expect(mockGetDoc).not.toHaveBeenCalled();
    });

    it('should fetch multiple works and maintain order', async () => {
      const mockDocSnap1 = createMockDocSnapshot('work-001', mockWorkData);
      const mockDocSnap2 = createMockDocSnapshot('work-002', {
        ...mockWorkData,
        title: 'Work 2',
      });

      mockGetDoc
        .mockResolvedValueOnce(mockDocSnap1 as never)
        .mockResolvedValueOnce(mockDocSnap2 as never);

      const works = await getWorksByIds(['work-001', 'work-002']);

      expect(works).toHaveLength(2);
      expect(works[0].id).toBe('work-001');
      expect(works[1].id).toBe('work-002');
    });

    it('should filter out non-existent works', async () => {
      const mockDocSnap1 = createMockDocSnapshot('work-001', mockWorkData);
      const mockDocSnap2 = createMockDocSnapshot('work-002', {}, false);

      mockGetDoc
        .mockResolvedValueOnce(mockDocSnap1 as never)
        .mockResolvedValueOnce(mockDocSnap2 as never);

      const works = await getWorksByIds(['work-001', 'work-002']);

      expect(works).toHaveLength(1);
      expect(works[0].id).toBe('work-001');
    });

    it('should filter out unpublished works', async () => {
      const mockDocSnap1 = createMockDocSnapshot('work-001', mockWorkData);
      const mockDocSnap2 = createMockDocSnapshot('work-002', {
        ...mockWorkData,
        isPublished: false,
      });

      mockGetDoc
        .mockResolvedValueOnce(mockDocSnap1 as never)
        .mockResolvedValueOnce(mockDocSnap2 as never);

      const works = await getWorksByIds(['work-001', 'work-002']);

      expect(works).toHaveLength(1);
      expect(works[0].id).toBe('work-001');
    });
  });
});

describe('mapFirestoreToWork (via getWorkById)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue('docRef' as never);
  });

  it('should correctly map Firestore data to Work type', async () => {
    const fullWorkData = {
      ...mockWorkData,
      shortDescription: 'Short desc',
      caption: 'Work caption',
      viewCount: 100,
    };

    const mockDocSnap = createMockDocSnapshot('work-001', fullWorkData);
    mockGetDoc.mockResolvedValue(mockDocSnap as never);

    const work = await getWorkById('work-001');

    expect(work).toMatchObject({
      id: 'work-001',
      title: 'Test Work',
      year: 2024,
      shortDescription: 'Short desc',
      fullDescription: 'Test description',
      caption: 'Work caption',
      viewCount: 100,
      isPublished: true,
    });
    expect(work?.images).toEqual([mockImage]);
    expect(work?.createdAt).toBeInstanceOf(Date);
    expect(work?.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle null/undefined timestamps gracefully', async () => {
    const dataWithoutTimestamps = {
      ...mockWorkData,
      createdAt: null,
      updatedAt: undefined,
      publishedAt: null,
    };

    const mockDocSnap = createMockDocSnapshot('work-001', dataWithoutTimestamps);
    mockGetDoc.mockResolvedValue(mockDocSnap as never);

    const work = await getWorkById('work-001');

    expect(work?.createdAt).toBeInstanceOf(Date);
    expect(work?.updatedAt).toBeInstanceOf(Date);
  });
});
