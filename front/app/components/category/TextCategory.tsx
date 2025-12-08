'use client';

import { motion } from 'framer-motion';
import type { ExhibitionCategory, CategoryState } from '@/types';

interface TextCategoryProps {
  category: ExhibitionCategory;
  isSelected: boolean;
  onSelect: () => void;
  hoveredCategoryId: string | null;
  onHover: (categoryId: string | null) => void;
  selectedWorkIds?: string[]; // 현재 선택된 카테고리의 작업 ID 목록 (disabled 상태 계산용)
}

export default function TextCategory({
  category,
  isSelected,
  onSelect,
  hoveredCategoryId,
  onHover,
  selectedWorkIds = [],
}: TextCategoryProps) {
  const isHovered = hoveredCategoryId === category.id;

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
          color: 'var(--color-category-clickable)',
          cursor: 'pointer',
          fontWeight: 'var(--font-weight-normal)',
        };
      case 'hover':
        return {
          ...baseStyle,
          color: 'transparent',
          WebkitTextStroke: '1px var(--color-category-hover-stroke)',
          cursor: 'pointer',
          fontWeight: 'var(--font-weight-bold)',
        };
      case 'active':
        return {
          ...baseStyle,
          color: 'var(--color-text-primary)',
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

  return (
    <span
      onClick={() => {
        if (isClickable) {
          onSelect();
        }
      }}
      onMouseEnter={() => {
        if (state !== 'basic' && state !== 'disabled') {
          onHover(category.id);
        }
      }}
      onMouseLeave={() => onHover(null)}
      style={categoryStyle}
    >
      <span style={{ display: 'block' }}>{displayTitle}</span>
      <span style={{ display: 'block', fontSize: 'var(--font-size-sm)' }}>{displayDescription}</span>
      {/* 선택 시 점(˙) 표시 - 문장형 카테고리와 동일하게 */}
      {isSelected && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.4 }}
          style={{
            position: 'absolute',
            top: 'var(--dot-offset-top)', // -8px (글자 정중앙 위)
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            color: 'var(--dot-color)',
            lineHeight: 1,
          }}
        >
          ˙
        </motion.span>
      )}
    </span>
  );
}
