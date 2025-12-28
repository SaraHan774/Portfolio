'use client';

/**
 * Fade In 이미지 컴포넌트
 * 이미지 로딩 시 부드러운 fade-in 효과와 스켈레톤 UI 제공
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface FadeInImageProps {
  /** 이미지 URL */
  src: string;
  /** 이미지 대체 텍스트 */
  alt: string;
  /** 이미지 원본 너비 */
  width: number;
  /** 이미지 원본 높이 */
  height: number;
  /** 우선 로딩 여부 (LCP 이미지에 사용) */
  priority?: boolean;
  /** 추가 스타일 */
  style?: React.CSSProperties;
}

/** 스켈레톤 표시 대기 시간 (ms) */
const SKELETON_DELAY_MS = 1200;

export default function FadeInImage({
  src,
  alt,
  width,
  height,
  priority = false,
  style = {},
}: FadeInImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const aspectRatio = height / width;

  // 일정 시간 후에도 로딩 중이면 스켈레톤 표시
  useEffect(() => {
    if (isLoaded) return;

    const timer = setTimeout(() => {
      if (!isLoaded) {
        setShowSkeleton(true);
      }
    }, SKELETON_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  return (
    <div
      style={{
        position: 'relative',
        width: style.width || '100%',
        paddingBottom: `${aspectRatio * 100}%`,
        borderRadius: style.borderRadius || '4px',
        overflow: 'hidden',
      }}
    >
      {/* 스켈레톤 - 일정 시간 후에도 로딩 중일 때만 표시 */}
      {!isLoaded && showSkeleton && (
        <div
          className="skeleton-shimmer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: style.borderRadius || '4px',
          }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        onLoad={() => setIsLoaded(true)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: style.borderRadius || '4px',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    </div>
  );
}

