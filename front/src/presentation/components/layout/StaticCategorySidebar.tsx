'use client';

import { memo, useState, useMemo } from 'react';
import ScrollableCategoryList from '../category/ScrollableCategoryList';
import SentenceCategory from '../category/SentenceCategory';
import TextCategory from '../category/TextCategory';
import type { SentenceCategory as SentenceCategoryType, ExhibitionCategory } from '@/types';

interface StaticCategorySidebarProps {
  sentenceCategories: SentenceCategoryType[];
  exhibitionCategories: ExhibitionCategory[];
  selectedKeywordId: string | null;
  selectedExhibitionCategoryId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  onExhibitionCategorySelect: (categoryId: string) => void;
  selectedWorkIds: string[];
}

/**
 * Static Category sidebar - vertical flow 용
 * absolute positioning 제거, flex layout 사용
 */
const StaticCategorySidebar = memo(function StaticCategorySidebar({
  sentenceCategories,
  exhibitionCategories,
  selectedKeywordId,
  selectedExhibitionCategoryId,
  onKeywordSelect,
  onExhibitionCategorySelect,
  selectedWorkIds,
}: StaticCategorySidebarProps) {
  const [hoveredKeywordId, setHoveredKeywordId] = useState<string | null>(null);
  const [hoveredExhibitionCategoryId, setHoveredExhibitionCategoryId] = useState<string | null>(null);

  // 문장형 카테고리만 필터링 및 정렬
  const sortedSentenceCategories = useMemo(
    () => sentenceCategories.filter((cat) => cat.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [sentenceCategories]
  );

  // 전시명 카테고리만 필터링 및 정렬
  const sortedExhibitionCategories = useMemo(
    () => exhibitionCategories.filter((cat) => cat.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [exhibitionCategories]
  );

  // Create stable handlers for exhibition categories
  const exhibitionSelectHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    sortedExhibitionCategories.forEach((category) => {
      handlers[category.id] = () => onExhibitionCategorySelect(category.id);
    });
    return handlers;
  }, [sortedExhibitionCategories, onExhibitionCategorySelect]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: 'var(--space-4)',
        paddingLeft: 'var(--category-margin-left)',
        paddingRight: 'var(--category-margin-right)',
        gap: 'var(--content-gap)',
      }}
    >
      {/* 좌측 문장형 카테고리 영역 */}
      <div
        style={{
          flex: '0 0 auto',
          maxWidth: 'calc(50% - var(--content-gap) / 2)',
        }}
      >
        <ScrollableCategoryList>
          {sortedSentenceCategories.map((category, index) => {
            const isLast = index === sortedSentenceCategories.length - 1;
            return (
              <div
                key={category.id}
                style={{
                  marginBottom: isLast ? 0 : 'var(--category-spacing)',
                }}
              >
                <SentenceCategory
                  category={category}
                  selectedKeywordId={selectedKeywordId}
                  onKeywordSelect={onKeywordSelect}
                  hoveredKeywordId={hoveredKeywordId}
                  onKeywordHover={setHoveredKeywordId}
                  selectedWorkIds={selectedWorkIds}
                />
              </div>
            );
          })}
        </ScrollableCategoryList>
      </div>

      {/* 우측 전시명 카테고리 영역 */}
      <div
        style={{
          flex: '0 0 auto',
          maxWidth: 'calc(50% - var(--content-gap) / 2)',
          textAlign: 'right',
        }}
      >
        <ScrollableCategoryList>
          {sortedExhibitionCategories.map((category, index) => {
            const isLast = index === sortedExhibitionCategories.length - 1;
            return (
              <div
                key={category.id}
                style={{
                  marginBottom: isLast ? 0 : 'var(--category-spacing)',
                }}
              >
                <TextCategory
                  category={category}
                  isSelected={selectedExhibitionCategoryId === category.id}
                  onSelect={exhibitionSelectHandlers[category.id]}
                  hoveredCategoryId={hoveredExhibitionCategoryId}
                  onHover={setHoveredExhibitionCategoryId}
                  selectedWorkIds={selectedWorkIds}
                />
              </div>
            );
          })}
        </ScrollableCategoryList>
      </div>
    </div>
  );
});

export default StaticCategorySidebar;
