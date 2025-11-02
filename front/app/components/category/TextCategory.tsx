'use client';

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
    <div
      onClick={onSelect}
      onMouseEnter={() => onHover(category.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        fontSize: 'var(--font-size-lg)',
        lineHeight: 'var(--line-height-relaxed)',
        color: isSelected || isHovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        fontWeight: isSelected ? 'var(--font-weight-bold)' : (isHovered ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)'),
        cursor: 'pointer',
        padding: 'var(--space-6) var(--space-3)',
        transition: 'all 0.1s ease',
      }}
    >
      {category.name}
    </div>
  );
}

