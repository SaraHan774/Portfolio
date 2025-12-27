'use client';

import Spinner from './Spinner';

interface LoadingContainerProps {
  /** Spinner size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable centered loading state container
 * Displays a spinner in the center of the screen
 */
export default function LoadingContainer({
  size = 24,
  className = '',
}: LoadingContainerProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`.trim()}>
      <Spinner size={size} />
    </div>
  );
}
