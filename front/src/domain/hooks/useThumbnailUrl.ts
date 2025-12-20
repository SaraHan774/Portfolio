// Custom hook for thumbnail URL calculation logic

import { useMemo } from 'react';
import type { Work } from '../../core/types';

/**
 * Calculate thumbnail URL from work data
 * Returns first image URL or undefined if no images exist
 */
export const useThumbnailUrl = (work: Work | undefined): string | undefined => {
  return useMemo(() => {
    if (!work || !work.images || work.images.length === 0) {
      return undefined;
    }
    return work.images[0].url;
  }, [work]);
};

/**
 * Get thumbnail URL from work object (non-hook version)
 * Useful for utility functions and non-component contexts
 */
export const getThumbnailUrl = (work: Work | undefined): string | undefined => {
  if (!work || !work.images || work.images.length === 0) {
    return undefined;
  }
  return work.images[0].url;
};
