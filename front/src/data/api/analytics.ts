import { getAnalytics, Analytics, logEvent, isSupported } from 'firebase/analytics';
import { getFirebaseApp } from './client';

let analyticsInstance: Analytics | null = null;

/**
 * Get Firebase Analytics instance
 * Lazy initialization with browser environment check
 */
export const getAnalyticsInstance = async (): Promise<Analytics | null> => {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Return cached instance if already initialized
  if (analyticsInstance) {
    return analyticsInstance;
  }

  try {
    // Check if analytics is supported in this browser
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Analytics is not supported in this browser');
      return null;
    }

    const app = getFirebaseApp();
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase Analytics:', error);
    return null;
  }
};

/**
 * Log a custom event to Google Analytics
 */
export const logAnalyticsEvent = async (
  eventName: string,
  eventParams?: Record<string, string | number>
): Promise<void> => {
  const analytics = await getAnalyticsInstance();
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
};

/**
 * Log page view event
 */
export const logPageView = async (pagePath: string, pageTitle: string): Promise<void> => {
  await logAnalyticsEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
};
