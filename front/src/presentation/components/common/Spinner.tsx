'use client';

import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Simple, elegant spinner component
 * Uses CSS animations for better performance
 */
export const Spinner = ({
  size = 20,
  color = 'var(--color-text-muted)',
  className
}: SpinnerProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid transparent`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    >
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Spinner;