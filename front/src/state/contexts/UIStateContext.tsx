'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export interface HoverPosition {
  x: number;
  y: number;
}

/**
 * UI state
 *
 * Note: Hover state in UIStateContext is for general work hover tracking (e.g., FloatingWorkWindow).
 * For caption-specific hover with safe zones, use useCaptionHoverEvents hook instead.
 */
export interface UIState {
  // General hover states (for FloatingWorkWindow, etc.)
  hoveredWorkId: string | null;
  hoverPosition: HoverPosition;

  // Modal states
  modalWorkId: string | null;

  // Mobile menu state
  mobileMenuOpen: boolean;
}

/**
 * UI state actions
 */
export interface UIStateActions {
  // Hover actions
  setHoveredWork: (workId: string | null, position?: HoverPosition) => void;
  clearHover: () => void;

  // Modal actions
  openModal: (workId: string) => void;
  closeModal: () => void;

  // Mobile menu actions
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

/**
 * Derived state selectors
 */
export interface UIStateSelectors {
  isHovering: boolean;
  isModalOpen: boolean;
  isMobileMenuOpen: boolean;
}

/**
 * Combined context type
 */
interface UIStateContextType extends UIState, UIStateActions, UIStateSelectors {}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export function UIStateProvider({ children }: { children: ReactNode }) {
  // Hover states
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<HoverPosition>({ x: 0, y: 0 });

  // Modal states
  const [modalWorkId, setModalWorkId] = useState<string | null>(null);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hover actions
  const setHoveredWork = useCallback((workId: string | null, position?: HoverPosition) => {
    setHoveredWorkId(workId);
    if (position) {
      setHoverPosition(position);
    }
  }, []);

  const clearHover = useCallback(() => {
    setHoveredWorkId(null);
  }, []);

  // Modal actions
  const openModal = useCallback((workId: string) => {
    setModalWorkId(workId);
  }, []);

  const closeModal = useCallback(() => {
    setModalWorkId(null);
  }, []);

  // Mobile menu actions
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  // Selectors (derived state)
  const selectors = useMemo<UIStateSelectors>(
    () => ({
      isHovering: hoveredWorkId !== null,
      isModalOpen: modalWorkId !== null,
      isMobileMenuOpen: mobileMenuOpen,
    }),
    [hoveredWorkId, modalWorkId, mobileMenuOpen]
  );

  const value = useMemo<UIStateContextType>(
    () => ({
      // State
      hoveredWorkId,
      hoverPosition,
      modalWorkId,
      mobileMenuOpen,
      // Actions
      setHoveredWork,
      clearHover,
      openModal,
      closeModal,
      setMobileMenuOpen,
      toggleMobileMenu,
      // Selectors
      ...selectors,
    }),
    [
      hoveredWorkId,
      hoverPosition,
      modalWorkId,
      mobileMenuOpen,
      setHoveredWork,
      clearHover,
      openModal,
      closeModal,
      toggleMobileMenu,
      selectors,
    ]
  );

  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}

/**
 * Individual selector hooks for fine-grained updates
 */
export function useHoveredWorkId() {
  return useUIState().hoveredWorkId;
}

export function useHoverPosition() {
  return useUIState().hoverPosition;
}

export function useIsHovering() {
  return useUIState().isHovering;
}

export function useModalWorkId() {
  return useUIState().modalWorkId;
}

export function useIsModalOpen() {
  return useUIState().isModalOpen;
}

export function useMobileMenuOpen() {
  return useUIState().mobileMenuOpen;
}

export function useIsMobileMenuOpen() {
  return useUIState().isMobileMenuOpen;
}