import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useWorks,
  useWork,
  useCreateWork,
  useUpdateWork,
  useDeleteWork,
  worksKeys,
} from '../../hooks/useWorks';
import {
  getWorks,
  getWork,
  createWork,
  updateWork,
  deleteWork,
} from '../../services/worksService';
import type { Work } from '../../types';

// Get mocked functions
const mockGetWorks = vi.mocked(getWorks);
const mockGetWork = vi.mocked(getWork);
const mockCreateWork = vi.mocked(createWork);
const mockUpdateWork = vi.mocked(updateWork);
const mockDeleteWork = vi.mocked(deleteWork);

const mockWork: Work = {
  id: 'work-001',
  title: 'Test Work',
  year: 2024,
  thumbnailImageId: 'img-001',
  images: [
    {
      id: 'img-001',
      url: 'https://example.com/image.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      order: 0,
      width: 800,
      height: 600,
    },
  ],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockWorks: Work[] = [
  mockWork,
  {
    ...mockWork,
    id: 'work-002',
    title: 'Test Work 2',
  },
];

// Create wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('worksKeys', () => {
  it('should generate correct query keys', () => {
    expect(worksKeys.all).toEqual(['works']);
    expect(worksKeys.lists()).toEqual(['works', 'list']);
    expect(worksKeys.list('active')).toEqual(['works', 'list', 'active']);
    expect(worksKeys.details()).toEqual(['works', 'detail']);
    expect(worksKeys.detail('123')).toEqual(['works', 'detail', '123']);
  });
});

describe('useWorks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all works successfully', async () => {
    mockGetWorks.mockResolvedValue(mockWorks);

    const { result } = renderHook(() => useWorks(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockWorks);
    expect(mockGetWorks).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch error', async () => {
    const error = new Error('Failed to fetch works');
    mockGetWorks.mockRejectedValue(error);

    const { result } = renderHook(() => useWorks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useWork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single work by id', async () => {
    mockGetWork.mockResolvedValue(mockWork);

    const { result } = renderHook(() => useWork('work-001'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockWork);
    expect(mockGetWork).toHaveBeenCalledWith('work-001');
  });

  it('should not fetch when id is undefined', async () => {
    const { result } = renderHook(() => useWork(undefined), {
      wrapper: createWrapper(),
    });

    // Should not be loading since query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetWork).not.toHaveBeenCalled();
  });

  it('should handle fetch error for single work', async () => {
    const error = new Error('Work not found');
    mockGetWork.mockRejectedValue(error);

    const { result } = renderHook(() => useWork('invalid-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useCreateWork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create work successfully', async () => {
    mockCreateWork.mockResolvedValue(mockWork);

    const { result } = renderHook(() => useCreateWork(), {
      wrapper: createWrapper(),
    });

    const newWorkData = {
      title: 'New Work',
      thumbnailImageId: 'img-001',
      images: [],
      sentenceCategoryIds: [],
      exhibitionCategoryIds: [],
      isPublished: false,
    };

    result.current.mutate(newWorkData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateWork).toHaveBeenCalledWith(newWorkData);
  });

  it('should handle create error', async () => {
    const error = new Error('Create failed');
    mockCreateWork.mockRejectedValue(error);

    const { result } = renderHook(() => useCreateWork(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'New Work',
      thumbnailImageId: 'img-001',
      images: [],
      sentenceCategoryIds: [],
      exhibitionCategoryIds: [],
      isPublished: false,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useUpdateWork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update work successfully', async () => {
    const updatedWork = { ...mockWork, title: 'Updated Title' };
    mockUpdateWork.mockResolvedValue(updatedWork);

    const { result } = renderHook(() => useUpdateWork(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'work-001',
      updates: { title: 'Updated Title' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdateWork).toHaveBeenCalledWith('work-001', {
      title: 'Updated Title',
    });
  });
});

describe('useDeleteWork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete work successfully', async () => {
    mockDeleteWork.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteWork(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('work-001');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteWork).toHaveBeenCalledTimes(1);
    expect(mockDeleteWork.mock.calls[0][0]).toBe('work-001');
  });

  it('should handle delete error', async () => {
    const error = new Error('Delete failed');
    mockDeleteWork.mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteWork(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('work-001');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});
