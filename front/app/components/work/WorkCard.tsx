'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Work } from '@/types';

interface WorkCardProps {
  work: Work;
  index?: number;
}

export default function WorkCard({ work }: WorkCardProps) {
  const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId) || work.images[0];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/works/${work.id}`}>
      <div
        className="group cursor-pointer"
        style={{
          transition: 'transform 0.2s ease-out',
          width: '80px', // PRD: 80px
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 제목: 「'작품명'」, 년도 형식 */}
        <div
          style={{
            minHeight: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginBottom: '4px',
          }}
        >
          <h3
            style={{
              fontSize: '12px', // PRD: 12px
              fontWeight: isHovered ? 700 : 400,
              color: 'var(--color-text-primary)',
              textAlign: 'center',
              lineHeight: '1.3',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              transition: 'font-weight 0.2s ease-out',
            }}
            title={work.title}
          >
            {`「'${work.title}'」`}
          </h3>
          {work.year && (
            <span
              style={{
                fontSize: '10px',
                color: 'var(--color-text-secondary)',
                marginTop: '2px',
              }}
            >
              {work.year}
            </span>
          )}
        </div>
        {/* 썸네일: 80x80, 호버 시 붉은 테두리 */}
        <div
          style={{
            aspectRatio: '1 / 1',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '2px',
            width: '80px', // PRD: 80px
            height: '80px', // PRD: 80px
            border: isHovered ? '2px solid red' : '2px solid transparent', // PRD: 붉은색 프레임
            transition: 'border-color 0.2s ease-out',
            boxSizing: 'border-box',
          }}
        >
          <Image
            src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url || ''}
            alt={work.title}
            fill
            sizes="80px"
            style={{
              objectFit: 'cover',
            }}
          />
        </div>
      </div>
    </Link>
  );
}

