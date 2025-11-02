'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Work } from '@/types';

interface WorkCardProps {
  work: Work;
  index: number;
}

export default function WorkCard({ work, index }: WorkCardProps) {
  const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId) || work.images[0];
  const [isHovered, setIsHovered] = useState(false);
  
  // 간단한 설명 생성 (shortDescription이 없으면 fullDescription에서 일부 추출)
  const description = work.shortDescription || 
    (work.fullDescription.length > 30 
      ? work.fullDescription.substring(0, 30) + '...' 
      : work.fullDescription);

  return (
    <Link href={`/works/${work.id}`}>
      <div
        className="group cursor-pointer"
        style={{
          transition: 'transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)', // Apple 스타일: 부드러운 transform
          width: '70px', // 카드 전체 너비 고정
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="group-hover:scale-[1.02] transition-transform duration-200 ease-out"
          style={{
            aspectRatio: '1 / 1',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '2px', // 4px의 50%
            marginBottom: 'var(--space-1)', // 8px
            width: '70px',
            height: '70px',
            transformOrigin: 'center', // 중앙 기준으로 확대하여 떨림 방지
          }}
        >
          <Image
            src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url || ''}
            alt={work.title}
            fill
            sizes="70px"
            style={{
              objectFit: 'cover',
            }}
          />
        </div>
        {/* 제목과 설명 영역 - 호버 시 확장 (고정 레이아웃으로 떨림 방지) */}
        <div
          style={{
            minHeight: '36px', // 제목 + 설명 영역 최소 높이 고정 (떨림 방지)
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
        <h3
          className="group-hover:font-bold transition-all duration-200 ease-out"
          style={{
              fontSize: '10px',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
              marginTop: 'var(--space-1)', // 8px
              marginBottom: '2px', // 고정된 마진 (떨림 방지)
            lineHeight: '1.2',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
          }}
            title={work.title}
        >
          {work.title}
        </h3>
          {/* 간단한 설명 - 호버 시에만 표시 (opacity만 변경하여 레이아웃 shift 방지) */}
          <div
            style={{
              fontSize: '8px',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              lineHeight: '1.3',
              marginTop: '2px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxHeight: '20px',
              height: '20px', // 고정 높이로 레이아웃 shift 방지
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease-out',
              pointerEvents: isHovered ? 'auto' : 'none',
            }}
            title={description}
          >
            {description}
          </div>
        </div>
      </div>
    </Link>
  );
}

