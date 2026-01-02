'use client';

import { memo, useState, useMemo, useRef, useEffect } from 'react';
import SentenceCategory from '../category/SentenceCategory';
import TextCategory from '../category/TextCategory';
import ScrollableCategoryList from '../category/ScrollableCategoryList';
import type { SentenceCategory as SentenceCategoryType, ExhibitionCategory } from '@/types';

interface CategorySidebarProps {
  sentenceCategories: SentenceCategoryType[];
  exhibitionCategories: ExhibitionCategory[];
  selectedKeywordId: string | null;
  selectedExhibitionCategoryId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  onExhibitionCategorySelect: (categoryId: string) => void;
  selectedWorkIds: string[];
  /** 문장형 카테고리 영역의 높이가 변경될 때 호출되는 콜백 */
  onSentenceCategoryHeightChange?: (height: number) => void;
  /** 전시명 카테고리 영역의 높이가 변경될 때 호출되는 콜백 */
  onExhibitionCategoryHeightChange?: (height: number) => void;
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
  onSentenceCategoryHeightChange,
  onExhibitionCategoryHeightChange,
}: CategorySidebarProps) {
  const [hoveredKeywordId, setHoveredKeywordId] = useState<string | null>(null);
  const [hoveredExhibitionCategoryId, setHoveredExhibitionCategoryId] = useState<string | null>(null);
  
  // 문장형 카테고리 영역의 ref - 높이 측정용
  const sentenceCategoryRef = useRef<HTMLDivElement>(null);
  // 전시명 카테고리 영역의 ref - 높이 측정용
  const exhibitionCategoryRef = useRef<HTMLDivElement>(null);
  
  // 문장형 카테고리만 필터링 및 정렬 (useEffect보다 먼저 정의)
  const sortedSentenceCategories = useMemo(
    () => sentenceCategories.filter((cat) => cat.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [sentenceCategories]
  );

  // 전시명 카테고리만 필터링 및 정렬 (useEffect보다 먼저 정의)
  const sortedExhibitionCategories = useMemo(
    () => exhibitionCategories.filter((cat) => cat.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [exhibitionCategories]
  );
  
  // ResizeObserver로 문장형 카테고리 영역의 높이 변화 감지
  // 의존성 배열에 카테고리 길이를 추가하여 데이터 로드 후 재측정
  useEffect(() => {
    if (!sentenceCategoryRef.current || !onSentenceCategoryHeightChange) return;
    
    const element = sentenceCategoryRef.current;
    
    // requestAnimationFrame으로 DOM 렌더링 완료 후 높이 측정
    const measureHeight = () => {
      requestAnimationFrame(() => {
        if (element) {
          const height = element.getBoundingClientRect().height;
          onSentenceCategoryHeightChange(height);
        }
      });
    };
    
    // 초기 높이 측정
    measureHeight();
    
    // ResizeObserver로 높이 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      measureHeight();
    });
    
    resizeObserver.observe(element);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [onSentenceCategoryHeightChange, sortedSentenceCategories.length]);
  
  // ResizeObserver로 전시명 카테고리 영역의 높이 변화 감지
  // 의존성 배열에 카테고리 길이를 추가하여 데이터 로드 후 재측정
  useEffect(() => {
    if (!exhibitionCategoryRef.current || !onExhibitionCategoryHeightChange) return;
    
    const element = exhibitionCategoryRef.current;
    
    // requestAnimationFrame으로 DOM 렌더링 완료 후 높이 측정
    const measureHeight = () => {
      requestAnimationFrame(() => {
        if (element) {
          const height = element.getBoundingClientRect().height;
          onExhibitionCategoryHeightChange(height);
        }
      });
    };
    
    // 초기 높이 측정
    measureHeight();
    
    // ResizeObserver로 높이 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      measureHeight();
    });
    
    resizeObserver.observe(element);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [onExhibitionCategoryHeightChange, sortedExhibitionCategories.length]);

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
        ref={sentenceCategoryRef}
        className="absolute"
        style={{
          left: 'var(--category-margin-left)', // 48px
          top: 'var(--space-4)', // 헤더 바로 아래 (64px)
          maxWidth: 'calc(70% - var(--content-gap) - var(--category-margin-left))',
          zIndex: 100,
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

      {/* 우측 전시명 카테고리 영역 (세로로 나열) */}
      <div
        ref={exhibitionCategoryRef}
        className="absolute"
        style={{
          right: 'var(--category-margin-right)', // 48px
          top: 'var(--space-4)', // 헤더 바로 아래 (64px)
          textAlign: 'right',
          maxWidth: 'calc(70% - var(--content-gap) - var(--category-margin-right))',
          zIndex: 100,
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

  return (
    prevProps.selectedKeywordId === nextProps.selectedKeywordId &&
    prevProps.selectedExhibitionCategoryId === nextProps.selectedExhibitionCategoryId &&
    workIdsEqual &&
    sentenceCatsEqual &&
    exhibitionCatsEqual
  );
});

export default CategorySidebar;
