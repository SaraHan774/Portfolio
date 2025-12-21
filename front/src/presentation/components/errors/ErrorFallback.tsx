'use client';

export interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

/**
 * Error Fallback Component
 *
 * Reusable error UI that can be used with ErrorBoundary or standalone
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export function ErrorFallback({
  error,
  resetError,
  title = '문제가 발생했습니다',
  message = '요청을 처리하는 중 오류가 발생했습니다. 페이지를 새로고침하거나 나중에 다시 시도해주세요.',
}: ErrorFallbackProps) {
  return (
    <div
      style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
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
        {resetError && (
          <button
            onClick={resetError}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              fontSize: 'var(--font-size-base)',
              backgroundColor: 'var(--color-text-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            다시 시도
          </button>
        )}
        {process.env.NODE_ENV === 'development' && error && (
          <details
            style={{
              marginTop: 'var(--space-6)',
              textAlign: 'left',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <summary style={{ cursor: 'pointer', marginBottom: 'var(--space-2)' }}>
              에러 상세 정보 (개발 모드)
            </summary>
            <pre
              style={{
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-gray-100)',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}