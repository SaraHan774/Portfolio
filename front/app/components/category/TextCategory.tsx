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

  // 글자 단위 애니메이션을 위한 렌더링 함수
  // hover 시 좌→우 샤라락 bold 효과, selected 시 bold 유지
  const renderAnimatedText = (text: string, fontSize?: string) => {
    const characters = text.split('');

    // hover: 샤라락 효과로 bold 전환
    // selected: 즉시 bold 유지
    // normal: 일반 weight
    const animateState = isHovered ? 'hover' : (isSelected ? 'selected' : 'normal');

    return (
      <motion.span
        style={{ display: 'block', fontSize }}
        initial={false}
        animate={animateState}
        variants={{
          hover: {
            transition: {
              staggerChildren: 0.02, // 각 글자 간 20ms 간격 (좌→우 샤라락)
            },
          },
          selected: {
            transition: {
              staggerChildren: 0, // 즉시 적용 (샤라락 없이 bold 유지)
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
            style={{ display: 'inline-block' }}
            variants={{
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
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>
    );
  };

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
      style={{
        ...categoryStyle,
        display: 'inline-block',
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
          initial={{ opacity: 0 }}
          animate={{ opacity: isSelected ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: isSelected ? 0.4 : 0 }}
          style={{
            color: 'var(--dot-color)',
          }}
        >
          ˙
        </motion.span>
      </span>
      {renderAnimatedText(displayTitle)}
      {renderAnimatedText(displayDescription, 'var(--font-size-sm)')}
    </span>
  );
}
