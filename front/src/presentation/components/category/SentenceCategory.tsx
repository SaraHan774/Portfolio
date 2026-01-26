'use client';

import { memo } from 'react';
import { useKeywordState, useKeywordStyle, useClickAnimationTracking } from '@/domain';
import { AnimatedCharacterText, DotIndicator, createCustomPreset } from '@/presentation/ui';
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
  // Debug mode (development only)
  const isDebugMode = process.env.NODE_ENV === 'development';

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
        ...(isDebugMode && {
          backgroundColor: 'rgba(255, 215, 0, 0.1)', // 노란색 반투명
          border: '1px dashed gold',
          position: 'relative',
          padding: '4px',
        }),
      }}
    >
      {isDebugMode && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: 0,
            fontSize: '8px',
            color: 'goldenrod',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '1px 3px',
            borderRadius: '2px',
          }}
        >
          SentenceCategory ({category.id})
        </div>
      )}
      {'\u2018'}{renderSentence()}{'\u2019'}
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
  // Debug mode (development only)
  const isDebugMode = process.env.NODE_ENV === 'development';

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
  const isActive = isHovered || isSelected;

  // Determine inactive color based on state
  const getInactiveColor = (): string => {
    if (state === 'clickable' || state === 'active') return 'var(--color-category-clickable)';
    if (state === 'disabled') return 'var(--color-category-disabled)';
    return 'var(--color-category-basic)';
  };

  return (
    <span
      onClick={handleClick}
      onMouseEnter={() => {
        if (state !== 'basic' && state !== 'disabled') {
          onHover(keyword.id);
        }
      }}
      onMouseLeave={() => onHover(null)}
      style={{
        ...keywordStyle,
        color: 'inherit', // Don't apply color from keywordStyle (controlled in characterStyle)
        ...(isDebugMode && {
          outline: '1px dotted orange',
          position: 'relative',
        }),
      }}
    >
      <AnimatedCharacterText
        text={text}
        isActive={isActive}
        isSelected={isSelected}
        hasBeenClickedBefore={hasBeenClickedBefore}
        {...createCustomPreset({ inactiveColor: getInactiveColor() })}
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
