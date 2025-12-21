'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import SentenceCategory from '@/app/components/category/SentenceCategory';
import TextCategory from '@/app/components/category/TextCategory';
import type { SentenceCategory as SentenceCategoryType, ExhibitionCategory } from '@/types';

interface CategorySidebarProps {
  sentenceCategories: SentenceCategoryType[];
  exhibitionCategories: ExhibitionCategory[];
  selectedKeywordId: string | null;
  selectedExhibitionCategoryId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  onExhibitionCategorySelect: (categoryId: string) => void;
  selectedWorkIds: string[];
}

/**
 * Category sidebar - completely independent from work selection
 * Only re-renders when category selection or hover state changes
 */
const CategorySidebar = memo(function CategorySidebar({
  sentenceCategories,
  exhibitionCategories,
  selectedKeywordId,
  selectedExhibitionCategoryId,
  onKeywordSelect,
  onExhibitionCategorySelect,
  selectedWorkIds,
}: CategorySidebarProps) {
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
    <>
      {/* 좌측 문장형 카테고리 영역 (세로로 나열) */}
      <div
        className="hidden lg:block absolute"
        style={{
          left: 'var(--category-margin-left)', // 48px
          top: 'var(--space-8)', // 헤더 바로 아래 (64px)
          maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-left))',
          zIndex: 100,
        }}
      >
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
      </div>

      {/* 우측 전시명 카테고리 영역 (세로로 나열) */}
      <div
        className="hidden lg:block absolute"
        style={{
          right: 'var(--category-margin-right)', // 48px
          top: 'var(--space-8)', // 헤더 바로 아래 (64px)
          textAlign: 'right',
          maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-right))',
          zIndex: 100,
        }}
      >
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
      </div>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders when work selection changes
  // Return true if props are equal (don't re-render)

  // Check array equality
  const workIdsEqual =
    prevProps.selectedWorkIds.length === nextProps.selectedWorkIds.length &&
    prevProps.selectedWorkIds.every((id, index) => id === nextProps.selectedWorkIds[index]);

  const sentenceCatsEqual =
    prevProps.sentenceCategories.length === nextProps.sentenceCategories.length &&
    prevProps.sentenceCategories.every((cat, index) => cat.id === nextProps.sentenceCategories[index].id);

  const exhibitionCatsEqual =
    prevProps.exhibitionCategories.length === nextProps.exhibitionCategories.length &&
    prevProps.exhibitionCategories.every((cat, index) => cat.id === nextProps.exhibitionCategories[index].id);

  const keywordIdEqual = prevProps.selectedKeywordId === nextProps.selectedKeywordId;
  const exhibitionIdEqual = prevProps.selectedExhibitionCategoryId === nextProps.selectedExhibitionCategoryId;

  const shouldSkipRender = keywordIdEqual && exhibitionIdEqual && workIdsEqual && sentenceCatsEqual && exhibitionCatsEqual;

  console.log('[CategorySidebar memo]', {
    keywordIdEqual,
    exhibitionIdEqual,
    workIdsEqual,
    sentenceCatsEqual,
    exhibitionCatsEqual,
    shouldSkipRender,
    prevKeyword: prevProps.selectedKeywordId,
    nextKeyword: nextProps.selectedKeywordId,
    prevWorkIds: prevProps.selectedWorkIds,
    nextWorkIds: nextProps.selectedWorkIds,
  });

  return shouldSkipRender;
});

export default CategorySidebar;
