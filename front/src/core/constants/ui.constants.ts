// UI-related constants

// Animation durations (ms)
export const ANIMATION_DURATION = {
  FAST: 100,
  NORMAL: 200,
  SLOW: 300,
  VERY_SLOW: 500,
} as const;

// Floating window configuration
export const FLOATING_WINDOW = {
  OFFSET_X: 12,
  OFFSET_Y: 8,
  WIDTH: 320,
  HEIGHT: 180,
  BOUNDARY_PADDING: 10,
} as const;

// Scroll configuration
export const SCROLL_AMOUNT = 200;

// Thumbnail sizes
export const THUMBNAIL_SIZE = {
  SMALL: 80,
  MEDIUM: 120,
  LARGE: 200,
  LIST: 80,
} as const;

// Layout spacing
export const LAYOUT = {
  CATEGORY_MARGIN_LEFT: '48px',
  CATEGORY_MARGIN_RIGHT: '48px',
  CONTENT_GAP: '32px',
  SPACE_UNIT: 8, // 8px base spacing
  CATEGORY_START: 64, // var(--space-8) 상단 카테고리 시작 위치 (px)
  WORKLIST_GAP: 24, // 카테고리와 작업 목록 사이 간격 (px)
  WORKLIST_CONTENT_GAP: 40, // 작업 목록과 메인 컨텐츠 사이 간격 (px)
} as const;

// WorkListScroller 높이 (Layout Shift 방지용)
export const WORKLIST_SCROLLER = {
  // 최소 높이: 타이틀(~30px) + 썸네일(80px) + 여백(~50px)
  MIN_HEIGHT: 160,
  // 타이틀만 있을 때 높이
  TITLE_ONLY_HEIGHT: 40,
} as const;

// Typography
export const TYPOGRAPHY = {
  DOT_OFFSET_TOP: '-8px',
  DOT_FONT_SIZE: '14px',
  WORK_TITLE_FONT_SIZE: '12px',
  CATEGORY_FONT_SIZE: '14px',
} as const;

// Z-index layers
export const Z_INDEX = {
  HOME_ICON: 200,
  WORK_LIST: 100,
  FADING_CONTENT: 1000,
  FLOATING_WINDOW: 50,
} as const;