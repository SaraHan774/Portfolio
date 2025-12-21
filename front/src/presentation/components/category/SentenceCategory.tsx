'use client';

import { memo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useKeywordState, useKeywordStyle } from '@/domain';
import { KEYWORD_ANIMATION_VARIANTS } from '@/core/constants';
import { categoryAnimationStore } from '@/core/utils';
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
  // 이 키워드가 사용자에 의해 클릭된 적이 있는지 확인 (페이지 이동 시에도 유지됨)
  const hasBeenClickedBefore = categoryAnimationStore.hasBeenClicked(keyword.id);

  // 방금 클릭했는지 추적 (점 애니메이션용)
  const justClicked = useRef(false);

  // justClicked 플래그 리셋
  useEffect(() => {
    if (justClicked.current && isSelected) {
      setTimeout(() => {
        justClicked.current = false;
      }, 0);
    }
  }, [isSelected]);

  // 상태 및 스타일 계산
  const state = useKeywordState({
    keyword,
    isSelected,
    isHovered,
    selectedWorkIds,
  });

  const keywordStyle = useKeywordStyle(state);

  // 글자 단위 애니메이션을 위해 텍스트를 문자 배열로 분리
  const characters = text.split('');

  // 클릭 가능 여부 확인
  const isClickable = state === 'clickable' || state === 'active' || state === 'hover';

  // 애니메이션 상태: 사용자가 클릭한 적이 있을 때만 selected 상태 사용
  // 첫 페이지 로드 시 selected=true여도 애니메이션 없이 정적으로 bold 표시
  const animateState = isHovered ? 'hover' : (isSelected && hasBeenClickedBefore) ? 'selected' : 'normal';

  // 초기 마운트 시 이미 선택된 상태이고 클릭된 적이 있다면, initial을 selected로 설정
  const initialState = isSelected && hasBeenClickedBefore ? 'selected' : false;

  // Handle click - mark as clicked BEFORE calling onSelect
  const handleClick = () => {
    if (isClickable) {
      if (!hasBeenClickedBefore) {
        categoryAnimationStore.markAsClicked(keyword.id);
        justClicked.current = true;
        console.log(`✓ User clicked keyword ${keyword.id}`);
      }
      onSelect(keyword.id);
    }
  };

  return (
    <motion.span
      onClick={handleClick}
      onMouseEnter={() => {
        if (state !== 'basic' && state !== 'disabled') {
          onHover(keyword.id);
        }
      }}
      onMouseLeave={() => onHover(null)}
      style={keywordStyle}
      initial={initialState}
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
          initial={{ opacity: justClicked.current ? 0 : 1 }}
          animate={{ opacity: 1 }}
          transition={justClicked.current ? { duration: 0.3, ease: 'easeOut', delay: 0.4 } : { duration: 0 }}
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
