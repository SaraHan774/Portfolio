// Tests for useSiteSettings hook

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { SettingsRepository } from '../../../data/repository/SettingsRepository';
import type { SiteSettings } from '@/core/types';

// Mock the repository
vi.mock('../../../data/repository/SettingsRepository', () => ({
  SettingsRepository: {
    getSiteSettings: vi.fn(),
  },
}));

const mockSettings: SiteSettings = {
  id: 'site-settings',
  browserTitle: 'Test Portfolio',
  browserDescription: 'Test Description',
  footerText: 'Test Footer',
  faviconUrl: 'https://example.com/favicon.ico',
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

describe('useSiteSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch site settings successfully', async () => {
    vi.mocked(SettingsRepository.getSiteSettings).mockResolvedValue(
      mockSettings
    );

    const { result } = renderHook(() => useSiteSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSettings);
    expect(SettingsRepository.getSiteSettings).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when fetching site settings', async () => {
    const error = new Error('Failed to fetch settings');
    vi.mocked(SettingsRepository.getSiteSettings).mockRejectedValue(error);

    const { result } = renderHook(() => useSiteSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it('should use long stale time for settings', async () => {
    vi.mocked(SettingsRepository.getSiteSettings).mockResolvedValue(
      mockSettings
    );

    const { result, rerender } = renderHook(() => useSiteSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const firstCallCount = vi.mocked(SettingsRepository.getSiteSettings).mock
      .calls.length;

    // Rerender - should use cached data
    rerender();

    expect(vi.mocked(SettingsRepository.getSiteSettings).mock.calls.length).toBe(
      firstCallCount
    );
  });
});
