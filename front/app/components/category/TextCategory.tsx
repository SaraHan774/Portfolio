'use client';

import { motion } from 'framer-motion';
import type { TextCategory as TextCategoryType } from '@/types';

interface TextCategoryProps {
  category: TextCategoryType;
  isSelected: boolean;
  onSelect: () => void;
  hoveredCategoryId: string | null;
  onHover: (categoryId: string | null) => void;
}

export default function TextCategory({
  category,
  isSelected,
  onSelect,
  hoveredCategoryId,
  onHover,
}: TextCategoryProps) {
  const isHovered = hoveredCategoryId === category.id;
  
  return (
    <span
      onClick={onSelect}
      onMouseEnter={() => onHover(category.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        fontSize: 'var(--category-font-size)', // 카테고리 폰트 사이즈 사용
        lineHeight: 'var(--line-height-relaxed)',
        color: isSelected || isHovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        fontWeight: isSelected || isHovered ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
        cursor: 'pointer',
        transition: 'color 0.2s ease-in-out, fontWeight 0.2s ease-in-out', // 애니메이션 없이 즉시 bold 처리
        position: 'relative',
        display: 'block', // 세로로 나열하기 위해 block으로 변경
        whiteSpace: 'normal', // 띄어쓰기 허용
      }}
    >
      {category.name}
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

