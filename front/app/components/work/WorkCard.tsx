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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={{ scale: 1.05 }}
        className="group cursor-pointer"
        style={{
          transition: 'transform 0.3s ease',
        }}
      >
        <div
          style={{
            aspectRatio: '1 / 1',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '4px',
            marginBottom: 'var(--space-2)',
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
          className="group-hover:font-bold transition-all"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            marginTop: 'var(--space-2)',
          }}
        >
          {work.title}
        </h3>
      </motion.div>
    </Link>
  );
}

