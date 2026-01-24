'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSwipeGesture } from '@/domain/hooks/useSwipeGesture';
import { MobileCategorySlider } from './MobileCategorySlider';
import SentenceCategory from '../category/SentenceCategory';
import TextCategory from '../category/TextCategory';
import type { SentenceCategory as SentenceCategoryType, ExhibitionCategory } from '@/types';

export interface MobileSwipeableCategoriesProps {
  sentenceCategories: SentenceCategoryType[];
  exhibitionCategories: ExhibitionCategory[];
  selectedKeywordId: string | null;
  selectedExhibitionCategoryId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  onExhibitionCategorySelect: (categoryId: string) => void;
  selectedWorkIds: string[];
}

/**
 * Mobile swipeable category views
 *
 * Features:
 * - Horizontal swipe gestures to switch between views
 * - View 0: SentenceCategory (default)
 * - View 1: ExhibitionCategory
 * - Horizontal slider indicator at top
 * - Smooth transitions with progress tracking
 */
export const MobileSwipeableCategories: React.FC<MobileSwipeableCategoriesProps> = ({
  sentenceCategories,
  exhibitionCategories,
  selectedKeywordId,
  selectedExhibitionCategoryId,
  onKeywordSelect,
  onExhibitionCategorySelect,
  selectedWorkIds,
}) => {
  const [activeViewIndex, setActiveViewIndex] = useState<0 | 1>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredKeywordId, setHoveredKeywordId] = useState<string | null>(null);
  const [hoveredExhibitionCategoryId, setHoveredExhibitionCategoryId] = useState<string | null>(null);

  // Client-side mount state (for hydration-safe debug labels)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Debug mode (development only)
  const isDebugMode = process.env.NODE_ENV === 'development';

  // Filter and sort categories (matching CategorySidebar pattern)
  const sortedSentenceCategories = useMemo(
    () => sentenceCategories.filter((cat) => cat.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [sentenceCategories]
  );

  const sortedExhibitionCategories = useMemo(
    () => exhibitionCategories.filter((cat) => cat.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [exhibitionCategories]
  );

  const handleViewChange = (newIndex: 0 | 1) => {
    if (isTransitioning || newIndex === activeViewIndex) return;

    setIsTransitioning(true);
    setActiveViewIndex(newIndex);

    // Cooldown period to prevent rapid swipes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const { handlers, swipeProgress, isSwiping } = useSwipeGesture({
    onSwipeLeft: () => handleViewChange(1),   // Switch to exhibition view
    onSwipeRight: () => handleViewChange(0),  // Switch to sentence view
    threshold: 50,
    velocityThreshold: 0.3,
  });

  // Toggle handler for slider click
  const handleSliderToggle = () => {
    const newIndex = activeViewIndex === 0 ? 1 : 0;
    handleViewChange(newIndex as 0 | 1);
  };


  // Calculate transform based on active view and swipe progress
  // activeViewIndex: 0 = 0%, 1 = -100% (each view is 100vw)
  // swipeProgress: -1 to 1 becomes -50% to 50% offset
  const baseTransform = -activeViewIndex * 100;
  const progressOffset = swipeProgress * 50;
  const totalTransform = baseTransform + progressOffset;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        ...(isDebugMode && {
          backgroundColor: 'rgba(255, 0, 0, 0.1)', // 빨간색 반투명 (디버그)
          border: '1px dashed red',
        }),
        paddingTop: 'var(--space-4)', // 32px (matching CategorySidebar)
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        overflow: 'hidden', // Hide overflowing content
        backgroundColor: 'var(--color-white)', // 배경색 추가 (스크롤 시 콘텐츠 가림)
      }}
      role="tablist"
      aria-label="Category views"
    >
      {/* 디버그 라벨 */}
      {mounted && isDebugMode && (
        <div style={{
          position: 'absolute',
          top: 2,
          right: 4,
          fontSize: '9px',
          color: 'red',
          fontWeight: 'bold',
          pointerEvents: 'none',
          zIndex: 1000,
        }}>
          MobileSwipeableCategories (sticky test)
        </div>
      )}
      {/* Horizontal slider indicator */}
      <MobileCategorySlider
        activeIndex={activeViewIndex}
        progress={swipeProgress}
        onToggle={handleSliderToggle}
      />

      {/* Swipeable container */}
      <div
        {...handlers}
        style={{
          position: 'relative', // Establish containing block
          overflow: 'hidden', // Hide content outside bounds
          overflowX: 'clip', // Force clip horizontal overflow
          touchAction: 'pan-y', // Allow vertical scrolling
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* Sliding views container */}
        <div
          style={{
            display: 'flex',
            width: '200vw', // Two full-width views side by side
            transform: `translateX(${totalTransform}%)`,
            transition: isSwiping
              ? 'none' // No transition during swipe
              : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth snap
          }}
        >
          {/* View 0: Sentence Categories */}
          <div
            style={{
              width: '100vw',
              flexShrink: 0,
            }}
            role="tabpanel"
            id="sentence-panel"
            aria-hidden={activeViewIndex !== 0}
          >
            <div
              style={{
                paddingLeft: 'var(--category-margin-left)',
                paddingRight: 'var(--category-margin-right)',
              }}
            >
            {sortedSentenceCategories.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-3)',
                  color: 'var(--color-gray-500)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                No categories available
              </div>
            ) : (
              <div>
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
            )}
            </div>
          </div>

          {/* View 1: Exhibition Categories */}
          <div
            style={{
              width: '100vw',
              flexShrink: 0,
            }}
            role="tabpanel"
            id="exhibition-panel"
            aria-hidden={activeViewIndex !== 1}
          >
            <div
              style={{
                paddingLeft: 'var(--category-margin-left)',
                paddingRight: 'var(--category-margin-right)',
                textAlign: 'right',
              }}
            >
            {sortedExhibitionCategories.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-3)',
                  color: 'var(--color-gray-500)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                No categories available
              </div>
            ) : (
              <div>
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
                        onSelect={() => onExhibitionCategorySelect(category.id)}
                        hoveredCategoryId={hoveredExhibitionCategoryId}
                        onHover={setHoveredExhibitionCategoryId}
                        selectedWorkIds={selectedWorkIds}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
