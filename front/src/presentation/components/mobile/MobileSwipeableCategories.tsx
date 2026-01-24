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


  // Calculate transform based on active view and swipe progress
  // activeViewIndex: 0 = 0%, 1 = -50%
  // swipeProgress: -1 to 1 becomes -25% to 25% offset
  const baseTransform = -activeViewIndex * 50;
  const progressOffset = swipeProgress * 25;
  const totalTransform = baseTransform + progressOffset;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        ...(isDebugMode && {
          backgroundColor: 'rgba(255, 0, 0, 0.1)', // 빨간색 반투명 (디버그)
          border: '1px dashed red',
        }),
        paddingTop: 'var(--space-4)', // 32px (matching CategorySidebar)
        paddingLeft: 'var(--category-margin-left)',
        paddingRight: 'var(--category-margin-right)',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        // 모바일에서 sticky 강제
        WebkitPosition: 'sticky',
        willChange: 'transform',
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
      />

      {/* Swipeable container */}
      <div
        {...handlers}
        style={{
          overflow: 'hidden',
          touchAction: 'pan-y', // Allow vertical scrolling
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* Sliding views container */}
        <div
          style={{
            display: 'flex',
            width: '200%', // Two views side by side
            transform: `translateX(${totalTransform}%)`,
            transition: isSwiping
              ? 'none' // No transition during swipe
              : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth snap
          }}
        >
          {/* View 0: Sentence Categories */}
          <div
            style={{ width: '50%', flexShrink: 0 }}
            role="tabpanel"
            id="sentence-panel"
            aria-hidden={activeViewIndex !== 0}
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

          {/* View 1: Exhibition Categories */}
          <div
            style={{
              width: '50%',
              flexShrink: 0,
              textAlign: 'right',
            }}
            role="tabpanel"
            id="exhibition-panel"
            aria-hidden={activeViewIndex !== 1}
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
  );
};
