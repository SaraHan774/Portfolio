'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
 */
export default function WorkTitleButton({
  work,
  isSelected,
  onClick,
  showThumbnail = false,
  anyWorkHovered = false,
}: WorkTitleButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine thumbnail to display
  const thumbnailImage =
    work.images?.find((img) => img.id === work.thumbnailImageId) ||
    work.images?.[0];
  const thumbnailUrl = thumbnailImage?.thumbnailUrl || thumbnailImage?.url;
  const hasThumbnail = !!thumbnailUrl;

  // Show thumbnail logic:
  // - Always show if showThumbnail=true (home page)
  // - Show on hover if showThumbnail=false (detail page)
  // - Also show if any work in the container is hovered (detail page)
  const shouldShowThumbnail =
    showThumbnail || (isHovered && hasThumbnail) || (anyWorkHovered && hasThumbnail);

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
        minWidth: '80px',
      }}
    >
      {/* 작업 제목 */}
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: isSelected ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
          color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          transition: 'font-weight 0.2s ease-out, color 0.2s ease-out',
        }}
      >
        {work.title}
      </span>

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
