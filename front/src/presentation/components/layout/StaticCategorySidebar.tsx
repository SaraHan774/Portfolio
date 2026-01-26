'use client';

import { memo, useState, useMemo } from 'react';
import { IS_DEBUG_LAYOUT_ENABLED } from '@/core/constants';
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

  // Debug mode (development only)
  const isDebugMode = IS_DEBUG_LAYOUT_ENABLED;

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
        marginTop: 'var(--space-3)',
        paddingLeft: 'var(--category-margin-left)',
        paddingRight: 'var(--category-margin-right)',
        gap: 'var(--content-gap)',
        ...(isDebugMode ? {
          backgroundColor: 'rgba(144, 238, 144, 0.1)', // 초록색 반투명
          border: '2px dashed limegreen',
          position: 'relative',
        } : {}),
      }}
    >
      {isDebugMode && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 4,
            fontSize: '10px',
            color: 'green',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 4px',
            borderRadius: '2px',
          }}
        >
          StaticCategorySidebar (Desktop)
        </div>
      )}
      {/* 좌측 문장형 카테고리 영역 */}
      <div
        style={{
          flex: '0 0 auto',
          maxWidth: 'calc(50% - var(--content-gap) / 2)',
          ...(isDebugMode ? {
            backgroundColor: 'rgba(255, 182, 193, 0.15)', // 연한 핑크
            border: '1px dashed lightcoral',
            position: 'relative',
          } : {}),
        }}
      >
        {isDebugMode && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 4,
              fontSize: '8px',
              color: 'lightcoral',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            Left: Sentence
          </div>
        )}
        <ScrollableCategoryList viewportHeightRatio={0.13}>
          {sortedSentenceCategories.map((category, index) => {
            const isLast = index === sortedSentenceCategories.length - 1;
            return (
              <div
                key={category.id}
                style={{
                  marginBottom: isLast ? 0 : '24px',
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
          ...(isDebugMode ? {
            backgroundColor: 'rgba(176, 224, 230, 0.15)', // 연한 파랑
            border: '1px dashed powderblue',
            position: 'relative',
          } : {}),
        }}
      >
        {isDebugMode && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              right: 4,
              fontSize: '8px',
              color: 'steelblue',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            Right: Exhibition
          </div>
        )}
        <ScrollableCategoryList viewportHeightRatio={0.13}>
          {sortedExhibitionCategories.map((category, index) => {
            const isLast = index === sortedExhibitionCategories.length - 1;
            return (
              <div
                key={category.id}
                style={{
                  marginBottom: isLast ? 0 : '18px',
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
