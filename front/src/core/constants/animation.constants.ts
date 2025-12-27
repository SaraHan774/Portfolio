// Framer Motion animation variants and configurations

import type { Variants } from 'framer-motion';

// Keyword character-by-character animation
export const KEYWORD_ANIMATION_VARIANTS: Record<string, Variants> = {
  container: {
    hover: {
      transition: {
        staggerChildren: 0.03, // 30ms stagger (left-to-right effect)
      },
    },
    selected: {
      transition: {
        staggerChildren: 0, // Instant
      },
    },
    normal: {
      transition: {
        staggerChildren: 0,
      },
    },
  },
  character: {
    hover: {
      fontWeight: 700,
      transition: {
        duration: 0.1,
        ease: 'easeOut',
      },
    },
    selected: {
      fontWeight: 700,
      transition: {
        duration: 0,
      },
    },
    normal: {
      fontWeight: 400,
      transition: {
        duration: 0.1,
        ease: 'easeOut',
      },
    },
  },
};

// Floating window animation
export const FLOATING_WINDOW_ANIMATION = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1], // Custom easing for smooth fade in
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0,
    },
  },
} as const;

// Dot indicator animation
export const DOT_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: 'easeOut', delay: 0.4 },
} as const;

// Work list fade in
export const WORK_LIST_ANIMATION = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
} as const;

// Thumbnail fade in
export const THUMBNAIL_ANIMATION = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const;