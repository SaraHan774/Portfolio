'use client';

/**
 * Character-by-character animation component
 *
 * Encapsulates the common pattern of splitting text into characters and
 * animating them individually with a stagger effect on hover/selection.
 */

import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { KEYWORD_ANIMATION_VARIANTS } from '@/core/constants';
import type { Variants } from 'framer-motion';

export interface AnimatedCharacterTextProps {
  /** Text to animate character-by-character */
  text: string;
  /** Whether the text is in active state (hovered or selected) */
  isActive: boolean;
  /** Whether the text is selected */
  isSelected: boolean;
  /** Whether this item has been clicked before (controls variant application) */
  hasBeenClickedBefore: boolean;
  /** Optional styles for the container span */
  containerStyle?: React.CSSProperties;
  /**
   * Optional styles for each character span
   * Can be a static object or a function that receives isActive state
   */
  characterStyle?: React.CSSProperties | ((isActive: boolean) => React.CSSProperties);
  /**
   * Optional custom variants for the container
   * Defaults to KEYWORD_ANIMATION_VARIANTS.container
   */
  containerVariants?: Variants;
  /**
   * Optional custom variants for each character
   * Defaults to KEYWORD_ANIMATION_VARIANTS.character
   */
  characterVariants?: Variants;
}

/**
 * AnimatedCharacterText - Reusable character-by-character animation component
 *
 * Used by TextCategory, SentenceCategory, and WorkTitleButton to provide
 * consistent character-by-character animation with left-to-right stagger effect.
 *
 * Features:
 * - Splits text into individual characters
 * - Animates font weight change with stagger on hover
 * - Handles initial state for already-selected items
 * - Preserves spaces as non-breaking spaces
 * - Conditionally applies variants based on click history
 *
 * @example
 * ```tsx
 * <AnimatedCharacterText
 *   text="Sample Text"
 *   isActive={isHovered || isSelected}
 *   isSelected={isSelected}
 *   hasBeenClickedBefore={hasBeenClickedBefore}
 *   characterStyle={(isActive) => ({
 *     display: 'inline-block',
 *     color: isActive ? 'transparent' : 'black',
 *     WebkitTextStroke: isActive ? '0.7px red' : '0px transparent',
 *   })}
 * />
 * ```
 */
const AnimatedCharacterText = memo(function AnimatedCharacterText({
  text,
  isActive,
  isSelected,
  hasBeenClickedBefore,
  containerStyle,
  characterStyle,
  containerVariants = KEYWORD_ANIMATION_VARIANTS.container,
  characterVariants = KEYWORD_ANIMATION_VARIANTS.character,
}: AnimatedCharacterTextProps) {
  // Split text into characters (memoized to avoid re-splitting on every render)
  const characters = useMemo(() => text.split(''), [text]);

  // Calculate animation state
  // - hover: User is hovering (triggers stagger animation)
  // - selected: Item is selected and has been clicked before (instant animation)
  // - normal: Default state
  const animateState = useMemo(() => {
    if (isActive && !isSelected) return 'hover';
    if (isSelected && hasBeenClickedBefore) return 'selected';
    return 'normal';
  }, [isActive, isSelected, hasBeenClickedBefore]);

  // Initial state for already-selected items on mount
  // If selected and clicked before, start in 'selected' state (no animation)
  const initialState = isSelected && hasBeenClickedBefore ? 'selected' : false;

  // Resolve character styles (handle function or object)
  const resolvedCharacterStyle = useMemo(() => {
    if (typeof characterStyle === 'function') {
      return characterStyle(isActive);
    }
    return characterStyle;
  }, [characterStyle, isActive]);

  return (
    <motion.span
      style={containerStyle}
      initial={initialState}
      animate={animateState}
      variants={containerVariants}
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          style={resolvedCharacterStyle}
          variants={hasBeenClickedBefore ? characterVariants : undefined}
        >
          {/* Preserve spaces as non-breaking spaces to prevent collapse in inline-block */}
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
});

export default AnimatedCharacterText;
