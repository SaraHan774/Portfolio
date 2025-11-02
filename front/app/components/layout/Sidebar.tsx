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

  // 문장형 카테고리만 필터링 및 정렬
  const sortedSentenceCategories = sentenceCategories
    .filter((cat) => cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // 텍스트형 카테고리만 필터링 및 정렬
  const sortedTextCategories = textCategories
    .filter((cat) => cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      {/* 좌측 문장형 카테고리 영역 (세로로 나열) */}
      <div
        className="hidden lg:block absolute"
        style={{
          left: 'var(--category-margin-left)', // 48px
          top: 'var(--space-16)', // 헤더 아래 여백
          maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-left))', // 중앙 영역과 겹치지 않도록 간격 확보
        }}
      >
        {sortedSentenceCategories.map((category, index) => {
          const isLast = index === sortedSentenceCategories.length - 1;
          return (
            <div
              key={category.id}
              style={{
                marginBottom: isLast ? 0 : 'var(--category-spacing)', // 카테고리 간 간격
              }}
            >
              <SentenceCategory
                category={category}
                selectedKeywordId={selectedKeywordId}
                onKeywordSelect={onKeywordSelect}
                hoveredKeywordId={hoveredKeywordId}
                onKeywordHover={setHoveredKeywordId}
              />
            </div>
          );
        })}
      </div>

      {/* 우측 텍스트형 카테고리 영역 (세로로 나열) */}
      <div
        className="hidden lg:block absolute"
        style={{
          right: 'var(--category-margin-right)', // 48px
          top: 'var(--space-16)', // 헤더 아래 여백
          textAlign: 'right',
          maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-right))', // 중앙 영역과 겹치지 않도록 간격 확보
        }}
      >
        {sortedTextCategories.map((category, index) => {
          const isLast = index === sortedTextCategories.length - 1;
          return (
            <div
              key={category.id}
              style={{
                marginBottom: isLast ? 0 : 'var(--category-spacing)', // 카테고리 간 간격
              }}
            >
              <TextCategory
              category={category}
              isSelected={selectedTextCategoryId === category.id}
              onSelect={() => onTextCategorySelect(category.id)}
              hoveredCategoryId={hoveredTextCategoryId}
              onHover={setHoveredTextCategoryId}
            />
            </div>
          );
        })}
      </div>
    </>
  );
}

