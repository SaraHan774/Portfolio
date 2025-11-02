'use client';

import SentenceCategory from '@/app/components/category/SentenceCategory';
import TextCategory from '@/app/components/category/TextCategory';
import type { SentenceCategory as SentenceCategoryType, TextCategory as TextCategoryType } from '@/types';
import { useState } from 'react';

interface SidebarProps {
  sentenceCategories: SentenceCategoryType[];
  textCategories: TextCategoryType[];
  selectedKeywordId: string | null;
  selectedTextCategoryId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  onTextCategorySelect: (categoryId: string) => void;
}

export default function Sidebar({
  sentenceCategories,
  textCategories,
  selectedKeywordId,
  selectedTextCategoryId,
  onKeywordSelect,
  onTextCategorySelect,
}: SidebarProps) {
  const [hoveredKeywordId, setHoveredKeywordId] = useState<string | null>(null);
  const [hoveredTextCategoryId, setHoveredTextCategoryId] = useState<string | null>(null);

  return (
    <>
      {/* 좌측 사이드바 (문장형 카테고리) */}
      <aside
        className="hidden lg:block fixed left-0 top-[60px] h-[calc(100vh-60px)] overflow-y-auto bg-white border-r border-gray-200"
        style={{
          width: 'var(--sidebar-width)',
          padding: 'var(--space-6) var(--space-3)',
        }}
      >
        {sentenceCategories
          .filter((cat) => cat.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((category) => (
            <SentenceCategory
              key={category.id}
              category={category}
              selectedKeywordId={selectedKeywordId}
              onKeywordSelect={onKeywordSelect}
              hoveredKeywordId={hoveredKeywordId}
              onKeywordHover={setHoveredKeywordId}
            />
          ))}
      </aside>

      {/* 우측 사이드바 (텍스트형 카테고리) */}
      <aside
        className="hidden lg:block fixed right-0 top-[60px] h-[calc(100vh-60px)] overflow-y-auto bg-white border-l border-gray-200"
        style={{
          width: 'var(--sidebar-width)',
          padding: 'var(--space-6) var(--space-3)',
        }}
      >
        {textCategories
          .filter((cat) => cat.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((category) => (
            <TextCategory
              key={category.id}
              category={category}
              isSelected={selectedTextCategoryId === category.id}
              onSelect={() => onTextCategorySelect(category.id)}
              hoveredCategoryId={hoveredTextCategoryId}
              onHover={setHoveredTextCategoryId}
            />
          ))}
      </aside>
    </>
  );
}

