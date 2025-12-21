// Tests for useWorks hooks

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  usePublishedWorks,
  useWork,
  useWorksByKeyword,
  useWorksByExhibitionCategory,
  useWorksByIds,
} from '../../hooks/useWorks';
import { WorkRepository } from '../../../data/repository/WorkRepository';
import type { Work } from '@/core/types';

// Mock the repository
vi.mock('../../../data/repository/WorkRepository', () => ({
  WorkRepository: {
    getPublishedWorks: vi.fn(),
    getWorkById: vi.fn(),
    getWorksByKeywordId: vi.fn(),
    getWorksByExhibitionCategoryId: vi.fn(),
    getWorksByIds: vi.fn(),
  },
}));

const mockWork: Work = {
  id: 'work1',
  title: 'Test Work',
  year: 2024,
  fullDescription: 'Test description',
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
  ],
  sentenceCategoryIds: ['keyword1'],
  exhibitionCategoryIds: ['exhibition1'],
  isPublished: true,
  publishedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePublishedWorks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch published works successfully', async () => {
    const mockWorks = [mockWork];
    vi.mocked(WorkRepository.getPublishedWorks).mockResolvedValue(mockWorks);

    const { result } = renderHook(() => usePublishedWorks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWorks);
    expect(WorkRepository.getPublishedWorks).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when fetching published works', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(WorkRepository.getPublishedWorks).mockRejectedValue(error);

    const { result } = renderHook(() => usePublishedWorks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useWork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch work by id successfully', async () => {
    vi.mocked(WorkRepository.getWorkById).mockResolvedValue(mockWork);

    const { result } = renderHook(() => useWork('work1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWork);
    expect(WorkRepository.getWorkById).toHaveBeenCalledWith('work1');
  });

  it('should not fetch when id is undefined', () => {
    vi.mocked(WorkRepository.getWorkById).mockResolvedValue(mockWork);

    const { result } = renderHook(() => useWork(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(WorkRepository.getWorkById).not.toHaveBeenCalled();
  });

  it('should handle errors when fetching work', async () => {
    const error = new Error('Work not found');
    vi.mocked(WorkRepository.getWorkById).mockRejectedValue(error);

    const { result } = renderHook(() => useWork('work1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useWorksByKeyword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch works by keyword id successfully', async () => {
    const mockWorks = [mockWork];
    vi.mocked(WorkRepository.getWorksByKeywordId).mockResolvedValue(mockWorks);

    const { result } = renderHook(() => useWorksByKeyword('keyword1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWorks);
    expect(WorkRepository.getWorksByKeywordId).toHaveBeenCalledWith('keyword1');
  });

  it('should not fetch when keywordId is undefined', async () => {
    vi.mocked(WorkRepository.getWorksByKeywordId).mockResolvedValue([]);

    const { result } = renderHook(() => useWorksByKeyword(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(WorkRepository.getWorksByKeywordId).not.toHaveBeenCalled();
  });
});

describe('useWorksByExhibitionCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch works by exhibition category id successfully', async () => {
    const mockWorks = [mockWork];
    vi.mocked(WorkRepository.getWorksByExhibitionCategoryId).mockResolvedValue(
      mockWorks
    );

    const { result } = renderHook(
      () => useWorksByExhibitionCategory('exhibition1'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWorks);
    expect(WorkRepository.getWorksByExhibitionCategoryId).toHaveBeenCalledWith(
      'exhibition1'
    );
  });

  it('should not fetch when categoryId is undefined', async () => {
    vi.mocked(WorkRepository.getWorksByExhibitionCategoryId).mockResolvedValue(
      []
    );

    const { result } = renderHook(() => useWorksByExhibitionCategory(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(WorkRepository.getWorksByExhibitionCategoryId).not.toHaveBeenCalled();
  });
});

describe('useWorksByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch works by ids successfully', async () => {
    const mockWorks = [mockWork];
    vi.mocked(WorkRepository.getWorksByIds).mockResolvedValue(mockWorks);

    const { result } = renderHook(() => useWorksByIds(['work1']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWorks);
    expect(WorkRepository.getWorksByIds).toHaveBeenCalledWith(['work1']);
  });

  it('should not fetch when workIds is undefined', async () => {
    vi.mocked(WorkRepository.getWorksByIds).mockResolvedValue([]);

    const { result } = renderHook(() => useWorksByIds(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(WorkRepository.getWorksByIds).not.toHaveBeenCalled();
  });

  it('should not fetch when workIds is empty array', async () => {
    vi.mocked(WorkRepository.getWorksByIds).mockResolvedValue([]);

    const { result } = renderHook(() => useWorksByIds([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(WorkRepository.getWorksByIds).not.toHaveBeenCalled();
  });
});
