// Tests for useWorkFiltering hook

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkFiltering } from '../../hooks/useWorkFiltering';
import type { Work } from '@/core/types';

const mockWorks: Work[] = [
  {
    id: 'work1',
    title: 'Work 1',
    year: 2024,
    fullDescription: 'Description 1',
    thumbnailImageId: 'img1',
    images: [],
    sentenceCategoryIds: ['keyword1', 'keyword2'],
    exhibitionCategoryIds: ['exhibition1'],
    isPublished: true,
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'work2',
    title: 'Work 2',
    year: 2024,
    fullDescription: 'Description 2',
    thumbnailImageId: 'img2',
    images: [],
    sentenceCategoryIds: ['keyword2'],
    exhibitionCategoryIds: ['exhibition2'],
    isPublished: true,
    publishedAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'work3',
    title: 'Work 3',
    year: 2024,
    fullDescription: 'Description 3',
    thumbnailImageId: 'img3',
    images: [],
    sentenceCategoryIds: ['keyword3'],
    exhibitionCategoryIds: ['exhibition1'],
    isPublished: true,
    publishedAt: new Date('2024-01-03'),
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

describe('useWorkFiltering', () => {
  it('should return all works when no filters are applied', () => {
    const { result } = renderHook(() =>
      useWorkFiltering({ works: mockWorks })
    );

    expect(result.current.filteredWorks).toEqual(mockWorks);
    expect(result.current.isFiltering).toBe(false);
    expect(result.current.filterCount).toBe(3);
  });

  it('should return empty array when works is undefined', () => {
    const { result } = renderHook(() =>
      useWorkFiltering({ works: undefined })
    );

    expect(result.current.filteredWorks).toEqual([]);
    expect(result.current.isFiltering).toBe(false);
    expect(result.current.filterCount).toBe(0);
  });

  it('should filter by keyword id', () => {
    const { result } = renderHook(() =>
      useWorkFiltering({ works: mockWorks, keywordId: 'keyword1' })
    );

    expect(result.current.filteredWorks).toHaveLength(1);
    expect(result.current.filteredWorks[0].id).toBe('work1');
    expect(result.current.isFiltering).toBe(true);
    expect(result.current.filterCount).toBe(1);
  });

  it('should filter by keyword id with multiple matches', () => {
    const { result } = renderHook(() =>
      useWorkFiltering({ works: mockWorks, keywordId: 'keyword2' })
    );

    expect(result.current.filteredWorks).toHaveLength(2);
    expect(result.current.filteredWorks.map((w) => w.id)).toEqual([
      'work1',
      'work2',
    ]);
    expect(result.current.isFiltering).toBe(true);
    expect(result.current.filterCount).toBe(2);
  });

  it('should filter by exhibition category id', () => {
    const { result } = renderHook(() =>
      useWorkFiltering({
        works: mockWorks,
        exhibitionCategoryId: 'exhibition1',
      })
    );

    expect(result.current.filteredWorks).toHaveLength(2);
    expect(result.current.filteredWorks.map((w) => w.id)).toEqual([
      'work1',
      'work3',
    ]);
    expect(result.current.isFiltering).toBe(true);
    expect(result.current.filterCount).toBe(2);
  });

  it('should prioritize keyword filter over exhibition filter', () => {
    const { result } = renderHook(() =>
      useWorkFiltering({
        works: mockWorks,
        keywordId: 'keyword1',
        exhibitionCategoryId: 'exhibition2',
      })
    );

    // keyword1 is only in work1
    expect(result.current.filteredWorks).toHaveLength(1);
    expect(result.current.filteredWorks[0].id).toBe('work1');
    expect(result.current.isFiltering).toBe(true);
  });

  it('should return empty array when no works match filter', () => {
    const { result } = renderHook(() =>
      useWorkFiltering({
        works: mockWorks,
        keywordId: 'nonexistent',
      })
    );

    expect(result.current.filteredWorks).toEqual([]);
    expect(result.current.isFiltering).toBe(true);
    expect(result.current.filterCount).toBe(0);
  });

  it('should handle empty works array', () => {
    const { result } = renderHook(() =>
      useWorkFiltering({ works: [], keywordId: 'keyword1' })
    );

    expect(result.current.filteredWorks).toEqual([]);
    expect(result.current.isFiltering).toBe(true);
    expect(result.current.filterCount).toBe(0);
  });

  it('should memoize results', () => {
    const { result, rerender } = renderHook(
      ({ works, keywordId }) => useWorkFiltering({ works, keywordId }),
      {
        initialProps: { works: mockWorks, keywordId: 'keyword1' },
      }
    );

    const firstResult = result.current.filteredWorks;

    // Rerender with same props
    rerender({ works: mockWorks, keywordId: 'keyword1' });

    expect(result.current.filteredWorks).toBe(firstResult);
  });

  it('should update when filter changes', () => {
    const { result, rerender } = renderHook(
      ({ works, keywordId }) => useWorkFiltering({ works, keywordId }),
      {
        initialProps: { works: mockWorks, keywordId: 'keyword1' },
      }
    );

    expect(result.current.filteredWorks).toHaveLength(1);

    // Change filter
    rerender({ works: mockWorks, keywordId: 'keyword2' });

    expect(result.current.filteredWorks).toHaveLength(2);
  });
});
