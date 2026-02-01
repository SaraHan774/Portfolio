// Error components
export { ErrorBoundary } from './errors/ErrorBoundary';

// Layout components
export { default as Footer } from './layout/Footer';
export { DebugGrid } from './layout/DebugGrid';
export { ColorPaletteDebugger } from './layout/ColorPaletteDebugger';

// Mobile components
export { MobileCategorySlider, MobileSwipeableCategories } from './mobile';
export type { MobileCategorySliderProps, MobileSwipeableCategoriesProps } from './mobile';

// Media components
export { YouTubeEmbed, ZoomableImage, ImageZoomOverlay } from './media';

// Work components
export { default as FloatingWorkWindow } from './work/FloatingWorkWindow';
export { default as WorkModal } from './work/WorkModal';
export { default as WorkModalMobile } from './work/WorkModalMobile';
export { default as CaptionWithBoundary } from './work/CaptionWithBoundary';
export { default as MediaTimeline } from './work/MediaTimeline';
