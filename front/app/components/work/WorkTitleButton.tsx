'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useThumbnailUrl } from '@/domain';
import { KEYWORD_ANIMATION_VARIANTS, DOT_ANIMATION } from '@/core/constants';
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

  // Use hook for thumbnail URL (includes YouTube fallback)
  const thumbnailUrl = useThumbnailUrl(work);
  const hasThumbnail = !!thumbnailUrl;

  // Show thumbnail logic:
  // - Always show if showThumbnail=true (home page)
  // - Show on hover if showThumbnail=false (detail page)
  // - Also show if any work in the container is hovered (detail page)
  const shouldShowThumbnail =
    showThumbnail || (isHovered && hasThumbnail) || (anyWorkHovered && hasThumbnail);

  // Animation state for character-by-character effect
  const animateState = isHovered ? 'hover' : isSelected ? 'selected' : 'normal';

  // Format title with quotes and year
  const displayText = `「'${work.title}'」${work.year ? `, ${work.year}` : ''}`;
  const characters = displayText.split('');

  // Container styling for dot positioning (no overflow)
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '150px', // Fixed width
  };

  // Title styling based on state (matches category keyword behavior)
  const titleStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'left',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s ease-in-out',
    // Selected or hovered: transparent with stroke (like category keywords)
    // Unselected: gray color
    ...(isSelected || isHovered
      ? {
          color: 'transparent',
          WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
        }
      : {
          color: 'var(--color-text-secondary)', // Gray for unselected
        }),
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        width: '150px', // Fixed width for entire button
      }}
    >
      {/* Container for title with dot indicator */}
      <div style={containerStyle}>
        {/* Dot indicator for selected work (positioned absolutely above) */}
        {isSelected && (
          <motion.span
            {...DOT_ANIMATION}
            style={{
              position: 'absolute',
              top: 'var(--dot-offset-top)', // -8px (center above text)
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '14px',
              color: 'var(--dot-color)',
              lineHeight: 1,
              zIndex: 10,
            }}
          >
            ˙
          </motion.span>
        )}

        {/* 작업 제목 + 년도 with character-by-character animation */}
        <motion.span
          style={titleStyle}
          initial={false}
          animate={animateState}
        >
          <motion.span
            style={{ display: 'inline-block' }}
            variants={KEYWORD_ANIMATION_VARIANTS.container}
          >
            {characters.map((char, charIndex) => (
              <motion.span
                key={charIndex}
                style={{ display: 'inline-block' }}
                variants={KEYWORD_ANIMATION_VARIANTS.character}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        </motion.span>
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
        {/* 썸네일: 홈에서는 항상 표시, 상세페이지에서는 hover 시에만 표시 */}
        {shouldShowThumbnail && hasThumbnail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '2px',
              overflow: 'hidden',
              border: isHovered ? '2px solid red' : '2px solid transparent',
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
            />
          </motion.div>
        )}
      </div>
    </button>
  );
}
