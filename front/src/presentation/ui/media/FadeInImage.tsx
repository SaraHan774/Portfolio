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
  /** 반응형 이미지 크기 힌트 (next/image sizes). 화면 크기에 맞는 변형 선택에 사용 */
  sizes?: string;
  /** 이미지 품질 (next/image quality). 미지정 시 Next 기본값(75) */
  quality?: number;
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
  sizes,
  quality,
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
          }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        quality={quality}
        onLoad={() => setIsLoaded(true)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // LCP(priority) 이미지는 페이드 게이트 없이 즉시 표시해 paint 지연을 없앤다.
          // 그 외 이미지는 기존 fade-in 유지.
          opacity: priority || isLoaded ? 1 : 0,
          transition: priority ? undefined : 'opacity 0.3s ease-in-out',
        }}
      />
    </div>
  );
}

