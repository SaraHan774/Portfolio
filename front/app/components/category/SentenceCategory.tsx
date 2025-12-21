'use client';

import { memo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useKeywordState, useKeywordStyle } from '@/domain';
import { KEYWORD_ANIMATION_VARIANTS, DOT_ANIMATION } from '@/core/constants';
import { categoryAnimationStore } from '@/app/utils/categoryAnimationStore';
import type { SentenceCategory as SentenceCategoryType, KeywordCategory } from '@/types';

interface SentenceCategoryProps {
  category: SentenceCategoryType;
  selectedKeywordId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  hoveredKeywordId: string | null;
  onKeywordHover: (keywordId: string | null) => void;
  selectedWorkIds?: string[]; // 현재 선택된 카테고리의 작업 ID 목록 (disabled 상태 계산용)
}

/**
 * Sentence category component with interactive keywords
 *
 * Features:
 * - Character-by-character animation on hover
 * - State-based styling (active, hover, disabled, clickable)
 * - Dot indicator for selected keywords
 * - Memoized to prevent re-renders when unrelated props change
 */
const SentenceCategory = memo(function SentenceCategory({
  category,
  selectedKeywordId,
  onKeywordSelect,
  hoveredKeywordId,
  onKeywordHover,
  selectedWorkIds = [],
}: SentenceCategoryProps) {
  // Render sentence with keywords as interactive spans
  const renderSentence = () => {
    const { sentence, keywords } = category;
    const parts: Array<{ text: string; keyword?: KeywordCategory }> = [];
    let lastIndex = 0;

    // Sort keywords by startIndex
    const sortedKeywords = [...keywords].sort((a, b) => a.startIndex - b.startIndex);

    sortedKeywords.forEach((keyword) => {
      // Plain text before keyword
      if (keyword.startIndex > lastIndex) {
        parts.push({ text: sentence.slice(lastIndex, keyword.startIndex) });
      }

      // Keyword text
      parts.push({
        text: sentence.slice(keyword.startIndex, keyword.endIndex),
        keyword,
      });

      lastIndex = keyword.endIndex;
    });

    // Remaining plain text
    if (lastIndex < sentence.length) {
      parts.push({ text: sentence.slice(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.keyword) {
        return (
          <AnimatedKeyword
            key={index}
            keyword={part.keyword}
            text={part.text}
            isSelected={selectedKeywordId === part.keyword.id}
            isHovered={hoveredKeywordId === part.keyword.id}
            selectedWorkIds={selectedWorkIds}
            onSelect={onKeywordSelect}
            onHover={onKeywordHover}
          />
        );
      }

      return <span key={index}>{part.text}</span>;
    });
  };

  return (
    <div
      style={{
        fontSize: 'var(--font-size-lg)',
        lineHeight: 'var(--line-height-relaxed)',
        color: 'var(--color-text-secondary)',
      }}
    >
      {'\''}{renderSentence()}{'\''}
    </div>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (don't re-render)
  // Return false if props are different (re-render)

  // Check array equality properly
  const workIdsEqual =
    prevProps.selectedWorkIds.length === nextProps.selectedWorkIds.length &&
    prevProps.selectedWorkIds.every((id, index) => id === nextProps.selectedWorkIds[index]);

  return (
    prevProps.category.id === nextProps.category.id &&
    prevProps.selectedKeywordId === nextProps.selectedKeywordId &&
    prevProps.hoveredKeywordId === nextProps.hoveredKeywordId &&
    prevProps.onKeywordSelect === nextProps.onKeywordSelect &&
    prevProps.onKeywordHover === nextProps.onKeywordHover &&
    workIdsEqual
  );
});

export default SentenceCategory;

/**
 * Animated keyword component with character-by-character animation
 */
function AnimatedKeyword({
  keyword,
  text,
  isSelected,
  isHovered,
  selectedWorkIds,
  onSelect,
  onHover,
}: {
  keyword: KeywordCategory;
  text: string;
  isSelected: boolean;
  isHovered: boolean;
  selectedWorkIds: string[];
  onSelect: (keywordId: string) => void;
  onHover: (keywordId: string | null) => void;
}) {
  // Track state transitions to detect user clicks vs initial render
  const prevIsSelected = useRef<boolean | null>(null);

  // Check if this keyword has ever been clicked (survives page navigation)
  const hasBeenClickedBefore = categoryAnimationStore.hasBeenClicked(keyword.id);

  // Determine if this is a user-triggered transition (false → true)
  const isUserClick = prevIsSelected.current === false && isSelected === true;

  useEffect(() => {
    if (isUserClick) {
      // Mark as clicked in persistent store
      categoryAnimationStore.markAsClicked(keyword.id);
    }
    prevIsSelected.current = isSelected;
  }, [isSelected, isUserClick, keyword.id]);

  // Use custom hooks for state and styling
  const state = useKeywordState({
    keyword,
    isSelected,
    isHovered,
    selectedWorkIds,
  });

  const keywordStyle = useKeywordStyle(state);

  // Split text into characters for animation
  const characters = text.split('');

  // Check if clickable
  const isClickable = state === 'clickable' || state === 'active' || state === 'hover';

  // Animation state: only use selected state if user has clicked it before
  // On first page load with selected=true, show static bold without animation
  const animateState = isHovered ? 'hover' : (isSelected && hasBeenClickedBefore) ? 'selected' : 'normal';

  // Only animate dot on user click transition
  const shouldAnimateDot = isUserClick;

  return (
    <motion.span
      onClick={() => {
        if (isClickable) {
          onSelect(keyword.id);
        }
      }}
      onMouseEnter={() => {
        if (state !== 'basic' && state !== 'disabled') {
          onHover(keyword.id);
        }
      }}
      onMouseLeave={() => onHover(null)}
      style={keywordStyle}
      initial={false}
      animate={animateState}
    >
      <motion.span
        style={{ display: 'inline-block' }}
        variants={KEYWORD_ANIMATION_VARIANTS.container}
      >
        {characters.map((char, charIndex) => (
          <motion.span
            key={charIndex}
            style={{
              display: 'inline-block',
              // Always show correct fontWeight, regardless of animation state
              fontWeight: isSelected ? 700 : 400,
            }}
            variants={hasBeenClickedBefore ? KEYWORD_ANIMATION_VARIANTS.character : undefined}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>

      {/* Dot indicator for selected keyword */}
      {isSelected && (
        <motion.span
          initial={{ opacity: shouldAnimateDot ? 0 : 1 }}
          animate={{ opacity: 1 }}
          transition={shouldAnimateDot ? { duration: 0.3, ease: 'easeOut', delay: 0.4 } : { duration: 0 }}
          style={{
            position: 'absolute',
            top: 'var(--dot-offset-top)', // -8px (center above text)
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '14px', // 10px + 4px increase
            color: 'var(--dot-color)',
            lineHeight: 1,
          }}
        >
          ˙
        </motion.span>
      )}
    </motion.span>
  );
}
