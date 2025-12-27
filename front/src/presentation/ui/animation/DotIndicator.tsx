'use client';

/**
 * Dot indicator component with fade-in animation
 *
 * Provides a standardized dot indicator (˙) that fades in when an item
 * is first selected, with configurable timing and positioning.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

export interface DotIndicatorProps {
  /** Whether the dot should be visible */
  isVisible: boolean;
  /** Whether this is the first appearance (triggers fade-in animation) */
  justAppeared: boolean;
  /**
   * Animation delay in seconds
   * @default 0.4 - Used by categories (TextCategory, SentenceCategory)
   * @example 0.1 - Used by WorkTitleButton for faster feedback
   */
  delay?: number;
  /**
   * Positioning strategy preset
   * - 'top-center': Absolute positioning centered above text (for inline keywords)
   * - 'above-text': Static block layout above text (for block categories)
   * - Custom positioning can be achieved via the style prop
   */
  position?: 'top-center' | 'above-text' | 'custom';
  /** Additional custom styles (overrides position preset) */
  style?: React.CSSProperties;
  /**
   * The dot character to display
   * @default '˙' - Middle dot
   */
  dotCharacter?: string;
}

/**
 * DotIndicator - Standardized dot appearance indicator
 *
 * Used by TextCategory, SentenceCategory, and WorkTitleButton to show
 * a dot above selected items with consistent fade-in animation.
 *
 * Features:
 * - Fade-in animation on first appearance (configurable delay)
 * - Instant appearance on re-selection
 * - Configurable positioning presets
 * - Type-safe animation timing
 *
 * Animation behavior:
 * - First selection: Fades in from opacity 0 → 1 with delay
 * - Re-selection: Appears instantly (no animation)
 * - Deselection: Instant fade out
 *
 * @example Category usage (0.4s delay, centered above)
 * ```tsx
 * <DotIndicator
 *   isVisible={isSelected}
 *   justAppeared={justClicked}
 *   delay={0.4}
 *   position="top-center"
 * />
 * ```
 *
 * @example Work title usage (0.1s delay, custom positioning)
 * ```tsx
 * <DotIndicator
 *   isVisible={isSelected}
 *   justAppeared={justSelected}
 *   delay={0.1}
 *   style={{
 *     position: 'absolute',
 *     top: '3px',
 *     left: '50%',
 *     transform: 'translateX(-50%)',
 *   }}
 * />
 * ```
 */
const DotIndicator = memo(function DotIndicator({
  isVisible,
  justAppeared,
  delay = 0.4,
  position = 'custom',
  style,
  dotCharacter = '˙',
}: DotIndicatorProps) {
  // Positioning presets
  const positionStyles: Record<'top-center' | 'above-text', React.CSSProperties> = {
    // Inline keyword positioning (SentenceCategory)
    'top-center': {
      position: 'absolute',
      top: 'var(--dot-offset-top)', // -8px (centered above text)
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '14px',
      color: 'var(--dot-color)',
      lineHeight: 1,
    },
    // Block category positioning (TextCategory)
    'above-text': {
      display: 'block',
      textAlign: 'center',
      fontSize: '14px',
      lineHeight: 1,
      height: '14px',
      marginBottom: '-4px',
      color: 'var(--dot-color)',
    },
  };

  // Resolve final styles (custom style overrides position preset)
  const finalStyle = style || (position !== 'custom' ? positionStyles[position] : {});

  return (
    <motion.span
      initial={{
        opacity: justAppeared ? 0 : isVisible ? 1 : 0,
      }}
      animate={{
        opacity: isVisible ? 1 : 0,
      }}
      transition={
        justAppeared
          ? {
              duration: 0.3,
              ease: 'easeOut',
              delay,
            }
          : {
              duration: 0,
            }
      }
      style={finalStyle}
    >
      {dotCharacter}
    </motion.span>
  );
});

export default DotIndicator;
