'use client';

import { memo } from 'react';
import { useKeywordState, useClickAnimationTracking } from '@/domain';
import { AnimatedCharacterText, DotIndicator, presets } from '@/presentation/ui';
import type { ExhibitionCategory } from '@/types';

interface TextCategoryProps {
  category: ExhibitionCategory;
  isSelected: boolean;
  onSelect: () => void;
  hoveredCategoryId: string | null;
  onHover: (categoryId: string | null) => void;
  selectedWorkIds?: string[]; // 현재 선택된 카테고리의 작업 ID 목록 (disabled 상태 계산용)
}

const TextCategory = memo(function TextCategory({
  category,
  isSelected,
  onSelect,
  hoveredCategoryId,
  onHover,
  selectedWorkIds = [],
}: TextCategoryProps) {
  const isHovered = hoveredCategoryId === category.id;

  // 상태 계산 (useKeywordState는 generic이므로 ExhibitionCategory도 지원)
  const state = useKeywordState({
    keyword: category,
    isSelected,
    isHovered,
    selectedWorkIds,
  });

  const isClickable = state === 'clickable' || state === 'active' || state === 'hover';

  // 클릭 애니메이션 추적
  const { hasBeenClickedBefore, justClicked, handleClick } = useClickAnimationTracking({
    itemId: category.id,
    isSelected,
    onSelect,
    isClickable,
  });

  // 전시명 카테고리 표시 형식: <작업명> + 전시유형, 공간, 년도
  const displayTitle = `<${category.title}>`;
  const displayDescription = `${category.description.exhibitionType}, ${category.description.venue}, ${category.description.year}`;

  // Title 글자 단위 애니메이션 - hover/active 시 stroke + bold 효과
  const renderTitleText = (text: string) => {
    const isActive = isHovered || isSelected;

    return (
      <AnimatedCharacterText
        text={text}
        isActive={isActive}
        isSelected={isSelected}
        hasBeenClickedBefore={hasBeenClickedBefore}
        {...presets.category()}
      />
    );
  };

  // Description 텍스트 - 항상 회색, bold 없음
  const renderDescriptionText = (text: string) => {
    return (
      <span
        style={{
          display: 'block',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-category-disabled)',
          fontWeight: 400,
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <span
      onClick={handleClick}
      onMouseEnter={() => {
        if (state !== 'basic' && state !== 'disabled') {
          onHover(category.id);
        }
      }}
      onMouseLeave={() => onHover(null)}
      style={{
        fontSize: 'var(--category-font-size)',
        lineHeight: 'var(--line-height-relaxed)',
        position: 'relative',
        display: 'inline-block',
        whiteSpace: 'normal',
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      {/* 점 공간 - 항상 동일한 높이 차지 (들썩임 방지) */}
      <span
        style={{
          display: 'block',
          textAlign: 'center',
          fontSize: '14px',
          lineHeight: 1,
          height: '14px',
          marginBottom: '-4px',
        }}
      >
        <DotIndicator
          isVisible={isSelected}
          justAppeared={justClicked}
          delay={0.4}
          position="custom"
          style={{
            color: 'var(--dot-color)',
          }}
        />
      </span>
      {renderTitleText(displayTitle)}
      {renderDescriptionText(displayDescription)}
    </span>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (don't re-render)
  // Return false if props are different (re-render)

  // Check array equality properly
  const workIdsEqual =
    (prevProps.selectedWorkIds?.length ?? 0) === (nextProps.selectedWorkIds?.length ?? 0) &&
    (prevProps.selectedWorkIds ?? []).every((id, index) => (nextProps.selectedWorkIds ?? [])[index] === id);

  return (
    prevProps.category.id === nextProps.category.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hoveredCategoryId === nextProps.hoveredCategoryId &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onHover === nextProps.onHover &&
    workIdsEqual
  );
});

export default TextCategory;
