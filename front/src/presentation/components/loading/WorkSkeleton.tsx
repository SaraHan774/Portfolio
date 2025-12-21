'use client';

export interface WorkSkeletonProps {
  /**  Number of skeleton items to show */
  count?: number;
}

/**
 * Work Skeleton Component
 *
 * Loading skeleton for work cards/items
 *
 * @example
 * ```tsx
 * <WorkSkeleton count={3} />
 * ```
 */
export function WorkSkeleton({ count = 1 }: WorkSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            marginBottom: index === count - 1 ? 0 : 'var(--space-2)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          {/* Work title skeleton */}
          <div
            style={{
              height: '20px',
              backgroundColor: 'var(--color-gray-200)',
              borderRadius: '4px',
              marginBottom: 'var(--space-1)',
              width: `${60 + Math.random() * 30}%`, // Varying widths for more realistic look
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Work Card Skeleton Component
 *
 * Loading skeleton for work card with thumbnail
 *
 * @example
 * ```tsx
 * <WorkCardSkeleton />
 * ```
 */
export function WorkCardSkeleton() {
  return (
    <div
      style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      {/* Thumbnail skeleton */}
      <div
        style={{
          width: '100%',
          paddingBottom: '75%', // 4:3 aspect ratio
          backgroundColor: 'var(--color-gray-200)',
          borderRadius: '4px',
          marginBottom: 'var(--space-2)',
        }}
      />
      {/* Title skeleton */}
      <div
        style={{
          height: '18px',
          backgroundColor: 'var(--color-gray-200)',
          borderRadius: '4px',
          width: '70%',
        }}
      />
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Work Grid Skeleton Component
 *
 * Loading skeleton for work grid layout
 *
 * @example
 * ```tsx
 * <WorkGridSkeleton count={6} />
 * ```
 */
export function WorkGridSkeleton({ count = 6 }: WorkSkeletonProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <WorkCardSkeleton key={index} />
      ))}
    </div>
  );
}