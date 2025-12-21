// Tests for useThumbnailUrl hook

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThumbnailUrl, getThumbnailUrl } from '../../hooks/useThumbnailUrl';
import type { Work } from '@/core/types';

const mockWorkWithImages: Work = {
  id: 'work1',
  title: 'Work with Images',
  year: 2024,
  fullDescription: 'Description',
  thumbnailImageId: 'image1',
  images: [
    {
      id: 'image1',
      url: 'https://example.com/image1.jpg',
      thumbnailUrl: 'https://example.com/image1-thumb.jpg',
      width: 800,
      height: 600,
      order: 0,
    },
    {
      id: 'image2',
      url: 'https://example.com/image2.jpg',
      thumbnailUrl: 'https://example.com/image2-thumb.jpg',
      width: 800,
      height: 600,
      order: 1,
    },
  ],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: true,
  publishedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockWorkWithoutImages: Work = {
  id: 'work2',
  title: 'Work without Images',
  year: 2024,
  fullDescription: 'Description',
  thumbnailImageId: 'image1',
  images: [],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: true,
  publishedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('useThumbnailUrl', () => {
  it('should return first image URL when work has images', () => {
    const { result } = renderHook(() => useThumbnailUrl(mockWorkWithImages));

    expect(result.current).toBe('https://example.com/image1.jpg');
  });

  it('should return undefined when work has no images', () => {
    const { result } = renderHook(() => useThumbnailUrl(mockWorkWithoutImages));

    expect(result.current).toBeUndefined();
  });

  it('should return undefined when work is undefined', () => {
    const { result } = renderHook(() => useThumbnailUrl(undefined));

    expect(result.current).toBeUndefined();
  });

  it('should memoize result', () => {
    const { result, rerender } = renderHook(
      ({ work }) => useThumbnailUrl(work),
      {
        initialProps: { work: mockWorkWithImages },
      }
    );

    const firstResult = result.current;

    // Rerender with same work
    rerender({ work: mockWorkWithImages });

    expect(result.current).toBe(firstResult);
  });

  it('should update when work changes', () => {
    const { result, rerender } = renderHook(
      ({ work }) => useThumbnailUrl(work),
      {
        initialProps: { work: mockWorkWithImages },
      }
    );

    expect(result.current).toBe('https://example.com/image1.jpg');

    // Change work
    rerender({ work: mockWorkWithoutImages });

    expect(result.current).toBeUndefined();
  });
});

describe('getThumbnailUrl', () => {
  it('should return first image URL when work has images', () => {
    const result = getThumbnailUrl(mockWorkWithImages);

    expect(result).toBe('https://example.com/image1.jpg');
  });

  it('should return undefined when work has no images', () => {
    const result = getThumbnailUrl(mockWorkWithoutImages);

    expect(result).toBeUndefined();
  });

  it('should return undefined when work is undefined', () => {
    const result = getThumbnailUrl(undefined);

    expect(result).toBeUndefined();
  });

  it('should handle work with empty images array', () => {
    const work = { ...mockWorkWithImages, images: [] };
    const result = getThumbnailUrl(work);

    expect(result).toBeUndefined();
  });
});
