import { useEffect } from 'react';
import { getAnalyticsInstance, logPageView } from '@/data/api';
import { usePathname } from 'next/navigation';

/**
 * Initialize Firebase Analytics and track page views
 */
export const useAnalytics = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize analytics on mount
    const initAnalytics = async () => {
      const analytics = await getAnalyticsInstance();
      if (analytics) {
        console.log('Firebase Analytics initialized');
      }
    };

    initAnalytics();
  }, []);

  useEffect(() => {
    // Track page view on route change
    const trackPageView = async () => {
      const pageTitle = document.title || 'Portfolio';
      await logPageView(pathname, pageTitle);
    };

    trackPageView();
  }, [pathname]);
};
