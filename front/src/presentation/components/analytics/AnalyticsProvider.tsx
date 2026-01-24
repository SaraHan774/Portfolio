'use client';

import { useAnalytics } from '@/domain/hooks';

/**
 * Analytics Provider Component
 * Initializes Firebase Analytics and tracks page views
 */
export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  useAnalytics();

  return <>{children}</>;
};
