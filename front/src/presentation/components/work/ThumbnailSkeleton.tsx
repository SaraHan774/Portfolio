import { motion } from 'framer-motion';

interface ThumbnailSkeletonProps {
  width?: string | number;
  height?: string | number;
}

/**
 * Skeleton UI for thumbnail loading state
 * Shown when image loading takes longer than 500ms
 */
export default function ThumbnailSkeleton({
  width = '80px',
  height = '80px',
}: ThumbnailSkeletonProps) {
  return (
    <motion.div
      role="status"
      aria-label="썸네일 로딩 중"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        width,
        height,
        backgroundColor: 'var(--color-gray-200)',
        borderRadius: '2px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer animation */}
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
          willChange: 'transform',
        }}
      />
    </motion.div>
  );
}
