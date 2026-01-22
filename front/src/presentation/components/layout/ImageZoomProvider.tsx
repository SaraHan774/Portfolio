'use client';

import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ImageZoomOverlay } from '@/presentation/components/media';
import { useIsZoomOpen } from '@/state/contexts/UIStateContext';

interface ImageZoomProviderProps {
  children: ReactNode;
}

/**
 * Provider component that mounts the ImageZoomOverlay
 *
 * Renders children alongside the zoom overlay which appears
 * above all other content when an image is zoomed.
 */
export default function ImageZoomProvider({ children }: ImageZoomProviderProps) {
  const isZoomOpen = useIsZoomOpen();

  return (
    <>
      {children}
      <AnimatePresence>
        {isZoomOpen && <ImageZoomOverlay />}
      </AnimatePresence>
    </>
  );
}
