'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

/**
 * Work selection state
 */
export interface WorkSelectionState {
  selectedWorkId: string | null;
}

/**
 * Work selection actions
 */
export interface WorkSelectionActions {
  selectWork: (workId: string | null) => void;
  clearSelection: () => void;
}

/**
 * Derived state selectors
 */
export interface WorkSelectionSelectors {
  isWorkSelected: boolean;
}

/**
 * Combined context type
 */
interface WorkSelectionContextType
  extends WorkSelectionState,
    WorkSelectionActions,
    WorkSelectionSelectors {}

const WorkSelectionContext = createContext<WorkSelectionContextType | undefined>(undefined);

export function WorkSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  // Actions
  const selectWork = useCallback((workId: string | null) => {
    setSelectedWorkId(workId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedWorkId(null);
  }, []);

  // Selectors (derived state)
  const selectors = useMemo<WorkSelectionSelectors>(
    () => ({
      isWorkSelected: selectedWorkId !== null,
    }),
    [selectedWorkId]
  );

  const value = useMemo<WorkSelectionContextType>(
    () => ({
      // State
      selectedWorkId,
      // Actions
      selectWork,
      clearSelection,
      // Selectors
      ...selectors,
    }),
    [selectedWorkId, selectWork, clearSelection, selectors]
  );

  return <WorkSelectionContext.Provider value={value}>{children}</WorkSelectionContext.Provider>;
}

export function useWorkSelection() {
  const context = useContext(WorkSelectionContext);
  if (context === undefined) {
    throw new Error('useWorkSelection must be used within a WorkSelectionProvider');
  }
  return context;
}

/**
 * Individual selector hooks for fine-grained updates
 */
export function useSelectedWorkId() {
  return useWorkSelection().selectedWorkId;
}

export function useIsWorkSelected() {
  return useWorkSelection().isWorkSelected;
}