'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface HoverPosition {
  x: number;
  y: number;
}

interface UIStateContextType {
  // Hover states
  hoveredWorkId: string | null;
  hoverPosition: HoverPosition;
  setHoveredWork: (workId: string | null, position?: HoverPosition) => void;
  clearHover: () => void;

  // Modal states
  modalWorkId: string | null;
  openModal: (workId: string) => void;
  closeModal: () => void;

  // Mobile menu state
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export function UIStateProvider({ children }: { children: ReactNode }) {
  // Hover states
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<HoverPosition>({ x: 0, y: 0 });

  // Modal states
  const [modalWorkId, setModalWorkId] = useState<string | null>(null);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const setHoveredWork = useCallback((workId: string | null, position?: HoverPosition) => {
    setHoveredWorkId(workId);
    if (position) {
      setHoverPosition(position);
    }
  }, []);

  const clearHover = useCallback(() => {
    setHoveredWorkId(null);
  }, []);

  const openModal = useCallback((workId: string) => {
    setModalWorkId(workId);
  }, []);

  const closeModal = useCallback(() => {
    setModalWorkId(null);
  }, []);

  return (
    <UIStateContext.Provider
      value={{
        hoveredWorkId,
        hoverPosition,
        setHoveredWork,
        clearHover,
        modalWorkId,
        openModal,
        closeModal,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}