'use client';

import Link from 'next/link';

export interface NotFoundProps {
  title?: string;
  message?: string;
  showHomeLink?: boolean;
}

/**
 * Not Found Component
 *
 * 404 error page component
 *
 * @example
 * ```tsx
 * <NotFound />
 * <NotFound title="작품을 찾을 수 없습니다" message="요청하신 작품이 존재하지 않거나 삭제되었습니다." />
 * ```
 */
export function NotFound({
  title = '페이지를 찾을 수 없습니다',
  message = '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
  showHomeLink = true,
}: NotFoundProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-4)',
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-6)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          {message}
        </p>
        {showHomeLink && (
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: 'var(--space-3) var(--space-6)',
              fontSize: 'var(--font-size-base)',
              backgroundColor: 'var(--color-text-primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            홈으로 돌아가기
          </Link>
        )}
      </div>
    </div>
  );
}