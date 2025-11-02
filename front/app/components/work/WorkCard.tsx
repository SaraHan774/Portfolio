'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Work } from '@/types';

interface WorkCardProps {
  work: Work;
  index: number;
}

export default function WorkCard({ work, index }: WorkCardProps) {
  const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId) || work.images[0];

  return (
    <Link href={`/works/${work.id}`}>
      <div
        className="group cursor-pointer"
        style={{
          transition: 'transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)', // Apple 스타일: 부드러운 transform
        }}
      >
        <div
          className="group-hover:scale-[1.02] transition-transform duration-200 ease-out"
          style={{
            aspectRatio: '1 / 1',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '2px', // 4px의 50%
            marginBottom: 'var(--space-1)', // 16px의 50%
            width: '100%',
            height: '100%',
          }}
        >
          <Image
            src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url || ''}
            alt={work.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw"
            style={{
              objectFit: 'cover',
            }}
          />
        </div>
        <h3
          className="group-hover:font-bold transition-all duration-200 ease-out"
          style={{
            fontSize: '10px', // 14px의 약 70% (너무 작아서 약간 조정)
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            marginTop: 'var(--space-1)', // 16px의 50%
            lineHeight: '1.2',
          }}
        >
          {work.title}
        </h3>
      </div>
    </Link>
  );
}

