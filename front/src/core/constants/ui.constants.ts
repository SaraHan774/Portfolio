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
} as const;

// Typography
export const TYPOGRAPHY = {
  DOT_OFFSET_TOP: '-8px',
  DOT_FONT_SIZE: '14px',
  WORK_TITLE_FONT_SIZE: '12px',
  CATEGORY_FONT_SIZE: '14px',
} as const;