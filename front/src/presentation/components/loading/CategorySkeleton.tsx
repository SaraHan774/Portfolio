'use client';

export interface CategorySkeletonProps {
  /** Number of category items to show */
  count?: number;
  /** Type of category skeleton */
  variant?: 'sentence' | 'exhibition';
}

/**
 * Category Skeleton Component
 *
 * Loading skeleton for category items
 *
 * @example
 * ```tsx
 * <CategorySkeleton count={3} variant="sentence" />
 * <CategorySkeleton count={2} variant="exhibition" />
 * ```
 */
export function CategorySkeleton({ count = 3, variant = 'sentence' }: CategorySkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            marginBottom: variant === 'sentence' ? 'var(--space-12)' : 'var(--space-2)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: `${index * 100}ms`,
          }}
        >
          {variant === 'sentence' ? (
            // Sentence category skeleton - multi-line
            <>
              <div
                style={{
                  height: '24px',
                  backgroundColor: 'var(--color-gray-200)',
                  borderRadius: '4px',
                  marginBottom: 'var(--space-2)',
                  width: '90%',
                }}
              />
              <div
                style={{
                  height: '24px',
                  backgroundColor: 'var(--color-gray-200)',
                  borderRadius: '4px',
                  width: `${60 + Math.random() * 25}%`,
                }}
              />
            </>
          ) : (
            // Exhibition category skeleton - single line
            <div
              style={{
                height: '20px',
                backgroundColor: 'var(--color-gray-200)',
                borderRadius: '4px',
                width: `${50 + Math.random() * 40}%`,
              }}
            />
          )}
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
 * Category Sidebar Skeleton Component
 *
 * Loading skeleton for the entire category sidebar
 *
 * @example
 * ```tsx
 * <CategorySidebarSkeleton />
 * ```
 */
export function CategorySidebarSkeleton() {
  return (
    <div
      style={{
        padding: 'var(--space-6)',
      }}
    >
      {/* Sentence categories section */}
      <div style={{ marginBottom: 'var(--space-16)' }}>
        <CategorySkeleton count={2} variant="sentence" />
      </div>

      {/* Exhibition categories section */}
      <div>
        <CategorySkeleton count={3} variant="exhibition" />
      </div>
    </div>
  );
}
