// Tests for useCategories hooks

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useSentenceCategories,
  useExhibitionCategories,
  useKeyword,
} from '../../hooks/useCategories';
import { CategoryRepository } from '../../../data/repository/CategoryRepository';
import type {
  SentenceCategory,
  ExhibitionCategory,
  KeywordCategory,
} from '@/core/types';

// Mock the repository
vi.mock('../../../data/repository/CategoryRepository', () => ({
  CategoryRepository: {
    getSentenceCategories: vi.fn(),
    getExhibitionCategories: vi.fn(),
    getKeywordById: vi.fn(),
  },
}));

const mockKeyword: KeywordCategory = {
  id: 'keyword1',
  name: 'Test Keyword',
  startIndex: 0,
  endIndex: 12,
  workOrders: [],
};

const mockSentenceCategory: SentenceCategory = {
  id: 'sentence1',
  sentence: 'Test Sentence',
  keywords: [mockKeyword],
  isActive: true,
  displayOrder: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockExhibitionCategory: ExhibitionCategory = {
  id: 'exhibition1',
  title: 'Test Exhibition',
  description: {
    exhibitionType: '2인전',
    venue: 'Test Venue',
    year: 2024,
  },
  displayOrder: 0,
  workOrders: [],
  isActive: true,
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

describe('useSentenceCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch sentence categories successfully', async () => {
    const mockCategories = [mockSentenceCategory];
    vi.mocked(CategoryRepository.getSentenceCategories).mockResolvedValue(
      mockCategories
    );

    const { result } = renderHook(() => useSentenceCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(CategoryRepository.getSentenceCategories).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when fetching sentence categories', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(CategoryRepository.getSentenceCategories).mockRejectedValue(
      error
    );

    const { result } = renderHook(() => useSentenceCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useExhibitionCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch exhibition categories successfully', async () => {
    const mockCategories = [mockExhibitionCategory];
    vi.mocked(CategoryRepository.getExhibitionCategories).mockResolvedValue(
      mockCategories
    );

    const { result } = renderHook(() => useExhibitionCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(CategoryRepository.getExhibitionCategories).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when fetching exhibition categories', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(CategoryRepository.getExhibitionCategories).mockRejectedValue(
      error
    );

    const { result } = renderHook(() => useExhibitionCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useKeyword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch keyword by id successfully', async () => {
    vi.mocked(CategoryRepository.getKeywordById).mockResolvedValue(mockKeyword);

    const { result } = renderHook(() => useKeyword('keyword1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockKeyword);
    expect(CategoryRepository.getKeywordById).toHaveBeenCalledWith('keyword1');
  });

  it('should not fetch when keywordId is undefined', async () => {
    const { result } = renderHook(() => useKeyword(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(CategoryRepository.getKeywordById).not.toHaveBeenCalled();
  });

  it('should handle errors when keyword is not found', async () => {
    const error = new Error('Keyword not found');
    vi.mocked(CategoryRepository.getKeywordById).mockRejectedValue(error);

    const { result } = renderHook(() => useKeyword('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
