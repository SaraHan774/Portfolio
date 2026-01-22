// Error components
export { ErrorBoundary } from './errors/ErrorBoundary';

// Layout components
export { default as CategorySidebar } from './layout/CategorySidebar';
export { default as Footer } from './layout/Footer';
export { default as MobileCategoryMenu } from './layout/MobileCategoryMenu';
export { default as PortfolioLayout } from './layout/PortfolioLayout';

// Mobile components
export { MobileCategorySlider, MobileSwipeableCategories } from './mobile';
export type { MobileCategorySliderProps, MobileSwipeableCategoriesProps } from './mobile';

// Media components
export { YouTubeEmbed, ZoomableImage, ImageZoomOverlay } from './media';

// Work components
export { default as FloatingWorkWindow } from './work/FloatingWorkWindow';
export { default as WorkListScroller } from './work/WorkListScroller';
export { default as WorkModal } from './work/WorkModal';
export { default as CaptionWithBoundary } from './work/CaptionWithBoundary';
export { default as MediaTimeline } from './work/MediaTimeline';
