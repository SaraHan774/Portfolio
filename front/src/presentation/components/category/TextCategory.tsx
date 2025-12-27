'use client';

import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { categoryAnimationStore } from '@/core/utils';
import type { ExhibitionCategory, CategoryState } from '@/types';

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

  // 이 카테고리가 사용자에 의해 클릭된 적이 있는지 확인 (페이지 이동 시에도 유지됨)
  const hasBeenClickedBefore = categoryAnimationStore.hasBeenClicked(category.id);

  // 방금 클릭했는지 추적 (점 애니메이션용) - state로 변경하여 render 중 접근 문제 해결
  const [justClicked, setJustClicked] = useState(false);

  // Track actual DOM click events, not state transitions
  const handleClick = () => {
    const isClickable = getCategoryState() === 'clickable' || getCategoryState() === 'active' || getCategoryState() === 'hover';
    if (isClickable) {
      // Mark as clicked in persistent store BEFORE calling onSelect
      // This ensures hasBeenClickedBefore is true when the component re-renders with selected=true
      if (!hasBeenClickedBefore) {
        categoryAnimationStore.markAsClicked(category.id);
        setJustClicked(true); // Mark that we just clicked
      }
      onSelect();
    }
  };

  // Reset justClicked after render
  useEffect(() => {
    if (justClicked && isSelected) {
      // Next render, this will be false
      setTimeout(() => {
        setJustClicked(false);
      }, 0);
    }
  }, [isSelected, justClicked]);

  // 애니메이션 상태 계산
  const animateState = isHovered ? 'hover' : (isSelected && hasBeenClickedBefore) ? 'selected' : 'normal';

  // 카테고리의 상태를 계산하는 함수
  const getCategoryState = (): CategoryState => {
    // active 상태: 선택된 경우
    if (isSelected) {
      return 'active';
    }

    // hover 상태: 마우스 오버 시
    if (isHovered) {
      return 'hover';
    }

    // disabled 상태: 선택된 카테고리가 있고, 이 카테고리가 선택된 작업에 포함되지 않는 경우
    // 주의: workOrders가 비어있어도 Work.exhibitionCategoryIds로 연결된 작업이 있을 수 있음
    if (selectedWorkIds.length > 0 && category.workOrders && category.workOrders.length > 0) {
      const categoryWorkIds = category.workOrders.map(order => order.workId);
      const hasCommonWork = categoryWorkIds.some(workId => selectedWorkIds.includes(workId));
      if (!hasCommonWork) {
        return 'disabled';
      }
    }

    // 모든 카테고리는 기본적으로 클릭 가능
    // (workOrders가 비어있어도 Work.exhibitionCategoryIds를 통해 작업 조회 가능)
    return 'clickable';
  };

  const state = getCategoryState();

  // 상태에 따른 스타일을 반환하는 함수
  const getCategoryStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontSize: 'var(--category-font-size)',
      lineHeight: 'var(--line-height-relaxed)',
      position: 'relative',
      display: 'block',
      whiteSpace: 'normal',
      transition: 'color 0.2s ease-in-out, fontWeight 0.2s ease-in-out',
    };

    switch (state) {
      case 'basic':
        return {
          ...baseStyle,
          color: 'var(--color-category-basic)',
          cursor: 'default',
          fontWeight: 'var(--font-weight-normal)',
        };
      case 'clickable':
        return {
          ...baseStyle,
          color: 'var(--color-category-clickable)', // 완전 검정 - 클릭 가능
          cursor: 'pointer',
          fontWeight: 'var(--font-weight-normal)',
        };
      case 'hover':
        return {
          ...baseStyle,
          color: 'transparent',
          WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
          cursor: 'pointer',
          fontWeight: 'var(--font-weight-bold)',
        };
      case 'active':
        return {
          ...baseStyle,
          color: 'transparent',
          WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
          cursor: 'pointer',
          fontWeight: 'var(--font-weight-bold)',
        };
      case 'disabled':
        return {
          ...baseStyle,
          color: 'var(--color-category-disabled)',
          cursor: 'default',
          fontWeight: 'var(--font-weight-normal)',
        };
      default:
        return baseStyle;
    }
  };

  const categoryStyle = getCategoryStyle();
  const isClickable = state === 'clickable' || state === 'active' || state === 'hover';

  // 전시명 카테고리 표시 형식: <작업명> + 전시유형, 공간, 년도
  const displayTitle = `<${category.title}>`;
  const displayDescription = `${category.description.exhibitionType}, ${category.description.venue}, ${category.description.year}`;

  // Title 글자 단위 애니메이션 - hover/active 시 stroke + bold 효과
  const renderTitleText = (text: string) => {
    const characters = text.split('');
    const isActive = isHovered || isSelected;

    // 초기 마운트 시 이미 선택된 상태이고 클릭된 적이 있다면, initial을 selected로 설정
    const initialState = isSelected && hasBeenClickedBefore ? 'selected' : false;

    const charVariants = hasBeenClickedBefore ? {
      hover: {
        fontWeight: 700,
        transition: {
          duration: 0.1,
          ease: 'easeOut' as const,
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
          ease: 'easeOut' as const,
        },
      },
    } as const : undefined;

    return (
      <motion.span
        style={{ display: 'block' }}
        initial={initialState}
        animate={animateState}
        variants={{
          hover: {
            transition: {
              staggerChildren: 0.02, // 좌→우 샤라락 효과
            },
          },
          selected: {
            transition: {
              staggerChildren: 0,
            },
          },
          normal: {
            transition: {
              staggerChildren: 0,
            },
          },
        }}
      >
        {characters.map((char, index) => (
          <motion.span
            key={index}
            style={{
              display: 'inline-block',
              color: isActive ? 'transparent' : 'var(--color-category-clickable)',
              WebkitTextStroke: isActive ? '0.7px var(--color-category-hover-stroke)' : '0px transparent',
              transition: 'color 0.1s ease-out, -webkit-text-stroke 0.1s ease-out',
              // Always show correct fontWeight, regardless of animation state
              fontWeight: isSelected ? 700 : 400,
            }}
            variants={charVariants}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>
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
        <motion.span
          initial={{ opacity: justClicked ? 0 : (isSelected ? 1 : 0) }}
          animate={{ opacity: isSelected ? 1 : 0 }}
          transition={
            justClicked
              ? { duration: 0.3, ease: 'easeOut', delay: 0.4 }
              : { duration: 0 }
          }
          style={{
            color: 'var(--dot-color)',
          }}
        >
          ˙
        </motion.span>
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
