// Custom hook for extracting work ID from URL pathname

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Extract work ID from URL pathname
 * Matches patterns like `/works/[workId]`
 *
 * @returns Work ID from URL or null if not in work detail route
 *
 * @example
 * // URL: /works/abc123
 * const workId = useSelectedWorkId(); // Returns: 'abc123'
 *
 * // URL: / (home)
 * const workId = useSelectedWorkId(); // Returns: null
 */
export const useSelectedWorkId = (): string | null => {
  const pathname = usePathname();

  return useMemo(() => {
    const match = pathname.match(/\/works\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);
};
