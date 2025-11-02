'use client';

import { motion } from 'framer-motion';
import WorkCard from './WorkCard';
import type { Work } from '@/types';

interface WorkGridProps {
  works: Work[];
}

export default function WorkGrid({ works }: WorkGridProps) {
  if (works.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-base)',
        }}
      >
        카테고리를 선택하세요
      </div>
    );
  }

  return (
    <motion.div
      className="grid work-grid"
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: 0.05,
            delayChildren: 0.6,
          },
        },
      }}
      style={{
        gridTemplateColumns: 'repeat(2, 1fr)',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'var(--space-6)',
        gap: 'var(--space-3)', // 24px 간격
      }}
    >
      {works.map((work, index) => (
        <WorkCard key={work.id} work={work} index={index} />
      ))}
    </motion.div>
  );
}


