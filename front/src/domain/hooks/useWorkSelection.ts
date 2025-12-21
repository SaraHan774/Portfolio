// Custom hook for work selection state management

import { useState, useCallback } from 'react';
import type { Work } from '../../core/types';

export interface UseWorkSelectionReturn {
  selectedWork: Work | null;
  hoveredWorkId: string | null;
  selectWork: (work: Work | null) => void;
  setHoveredWorkId: (id: string | null) => void;
  isWorkSelected: (workId: string) => boolean;
  isWorkHovered: (workId: string) => boolean;
}

/**
 * Hook for managing work selection and hover state
 * Provides unified interface for work interaction states
 */
export const useWorkSelection = (): UseWorkSelectionReturn => {
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);

  const selectWork = useCallback((work: Work | null) => {
    setSelectedWork(work);
  }, []);

  const isWorkSelected = useCallback(
    (workId: string): boolean => {
      return selectedWork?.id === workId;
    },
    [selectedWork]
  );

  const isWorkHovered = useCallback(
    (workId: string): boolean => {
      return hoveredWorkId === workId;
    },
    [hoveredWorkId]
  );

  return {
    selectedWork,
    hoveredWorkId,
    selectWork,
    setHoveredWorkId,
    isWorkSelected,
    isWorkHovered,
  };
};
