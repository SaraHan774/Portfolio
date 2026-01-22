'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useThumbnailUrl, useClickAnimationTracking } from '@/domain';
import { AnimatedCharacterText, DotIndicator, presets } from '@/presentation/ui';
import ThumbnailSkeleton from './ThumbnailSkeleton';
import type { Work } from '@/types';

interface WorkTitleButtonProps {
  work: Work;
  isSelected: boolean;
  onClick: () => void;
  showThumbnail?: boolean;
  anyWorkHovered?: boolean;
}

/**
 * Work title button component with optional thumbnail display
 *
 * Behavior:
 * - Home page (showThumbnail=true): Always shows thumbnail
 * - Detail page (showThumbnail=false): Shows thumbnail only on hover
 * - Hover effect: Character-by-character animation with transparent stroke
 * - Fixed width: 150px with overflow handling
 */
export default function WorkTitleButton({
  work,
  isSelected,
  onClick,
  showThumbnail = false,
  anyWorkHovered = false,
}: WorkTitleButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 클릭 애니메이션 추적 (Works는 항상 클릭 가능)
  const { hasBeenClickedBefore: wasSelectedBefore, justClicked: justSelected, handleClick } = useClickAnimationTracking({
    itemId: work.id,
    isSelected,
    onSelect: onClick,
    isClickable: true, // Works are always clickable
  });

  // Use hook for thumbnail URL (includes YouTube fallback)
  const thumbnailUrl = useThumbnailUrl(work);
  const hasThumbnail = !!thumbnailUrl;

  // Reset loading state when thumbnail URL changes
  useEffect(() => {
    if (thumbnailUrl) {
      setImageLoaded(false);
      setShowSkeleton(false);

      // Start 500ms timer to show skeleton if image hasn't loaded
      loadingTimerRef.current = setTimeout(() => {
        setShowSkeleton(true);
      }, 500);

      return () => {
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
      };
    }
  }, [thumbnailUrl]);

  // Show thumbnail logic:
  // - Always show if showThumbnail=true (home page)
  // - Show on hover if showThumbnail=false (detail page)
  // - Also show if any work in the container is hovered (detail page)
  const shouldShowThumbnail =
    showThumbnail || (isHovered && hasThumbnail) || (anyWorkHovered && hasThumbnail);

  // Handle image load completion
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setShowSkeleton(false);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageLoaded(true); // Hide skeleton
    setShowSkeleton(false);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, []);

  // Format title with quotes and year
  const displayText = `「‘${work.title}’」${work.year ? `,\u00A0${work.year}` : ''}`;

  // Container styling for dot positioning (no overflow)
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    paddingTop: '12px', // Make room for dot positioned at -8px
  };

  // Title wrapper styling (no color - controlled in characterStyle)
  const titleStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Center thumbnail below title
        gap: '8px',
      }}
    >
      {/* Container for title with dot indicator */}
      <div style={containerStyle}>
        {/* Dot indicator for selected work (positioned absolutely above) */}
        {isSelected && (
          <DotIndicator
            isVisible={isSelected}
            justAppeared={justSelected}
            delay={0.1} // Works use faster feedback (0.1s vs 0.4s for categories)
            position="custom"
            style={{
              position: 'absolute',
              top: '3px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '18px',
              color: 'var(--dot-color)',
              lineHeight: 1,
              zIndex: 10,
            }}
          />
        )}

        {/* 작업 제목 + 년도 (using 'work' preset) */}
        <span style={titleStyle}>
          <AnimatedCharacterText
            text={displayText}
            isActive={isHovered || isSelected}
            isSelected={isSelected}
            hasBeenClickedBefore={wasSelectedBefore}
            {...presets.work()}
          />
        </span>
      </div>

      {/* 썸네일 공간 (항상 확보하여 레이아웃 안정성 유지) */}
      <div
        style={{
          width: '80px',
          height: '80px',
          position: 'relative',
          borderRadius: '2px',
          boxSizing: 'border-box',
        }}
      >
        {/* 스켈레톤 UI: 로딩 중이고 1초 이상 걸릴 때 표시 */}
        {shouldShowThumbnail && hasThumbnail && showSkeleton && !imageLoaded && (
          <ThumbnailSkeleton width="80px" height="80px" />
        )}

        {/* 썸네일: 홈에서는 항상 표시, 상세페이지에서는 hover 시에만 표시 */}
        {shouldShowThumbnail && hasThumbnail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 0.95 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              border: isHovered ? '1px solid #B22222' : '1px solid transparent',
              transition: 'border-color 0.2s ease-out',
              boxSizing: 'border-box',
            }}
          >
            <Image
              src={thumbnailUrl}
              alt={work.title}
              fill
              sizes="80px"
              style={{ objectFit: 'cover' }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </motion.div>
        )}
      </div>
    </button>
  );
}
