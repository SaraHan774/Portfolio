'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface WorkSelectionContextType {
  selectedWorkId: string | null;
  selectWork: (workId: string | null) => void;
  clearSelection: () => void;
}

const WorkSelectionContext = createContext<WorkSelectionContextType | undefined>(undefined);

export function WorkSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  const selectWork = useCallback((workId: string | null) => {
    setSelectedWorkId(workId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedWorkId(null);
  }, []);

  return (
    <WorkSelectionContext.Provider
      value={{
        selectedWorkId,
        selectWork,
        clearSelection,
      }}
    >
      {children}
    </WorkSelectionContext.Provider>
  );
}

export function useWorkSelection() {
  const context = useContext(WorkSelectionContext);
  if (context === undefined) {
    throw new Error('useWorkSelection must be used within a WorkSelectionProvider');
  }
  return context;
}