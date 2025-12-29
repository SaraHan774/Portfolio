'use client';

import { memo } from 'react';
import { useKeywordState, useKeywordStyle, useClickAnimationTracking } from '@/domain';
import { AnimatedCharacterText, DotIndicator } from '@/presentation/ui';
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
        fontSize: 'var(--font-size-sm)',
        lineHeight: 'var(--line-height-relaxed)',
        color: 'var(--color-text-secondary)',
      }}
    >
      {'‘'}{renderSentence()}{'’'}
    </div>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (don't re-render)
  // Return false if props are different (re-render)

  // Check array equality properly
  const prevWorkIds = prevProps.selectedWorkIds ?? [];
  const nextWorkIds = nextProps.selectedWorkIds ?? [];
  const workIdsEqual =
    prevWorkIds.length === nextWorkIds.length &&
    prevWorkIds.every((id, index) => nextWorkIds[index] === id);

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
  // 클릭 가능 여부 확인 (state 먼저 계산 필요)
  const state = useKeywordState({
    keyword,
    isSelected,
    isHovered,
    selectedWorkIds,
  });

  const isClickable = state === 'clickable' || state === 'active' || state === 'hover';

  // 클릭 애니메이션 추적 (점 fade-in 제어)
  const { hasBeenClickedBefore, justClicked, handleClick } = useClickAnimationTracking({
    itemId: keyword.id,
    isSelected,
    onSelect: () => onSelect(keyword.id),
    isClickable,
  });

  const keywordStyle = useKeywordStyle(state);

  return (
    <span
      onClick={handleClick}
      onMouseEnter={() => {
        if (state !== 'basic' && state !== 'disabled') {
          onHover(keyword.id);
        }
      }}
      onMouseLeave={() => onHover(null)}
      style={keywordStyle}
    >
      <AnimatedCharacterText
        text={text}
        isActive={isHovered || isSelected}
        isSelected={isSelected}
        hasBeenClickedBefore={hasBeenClickedBefore}
        containerStyle={{ display: 'inline-block' }}
        characterStyle={{
          display: 'inline-block',
          // Always show correct fontWeight, regardless of animation state
          fontWeight: isSelected ? 700 : 400,
        }}
      />

      {/* Dot indicator for selected keyword */}
      {isSelected && (
        <DotIndicator
          isVisible={isSelected}
          justAppeared={justClicked}
          delay={0.4}
          position="top-center"
        />
      )}
    </span>
  );
}
