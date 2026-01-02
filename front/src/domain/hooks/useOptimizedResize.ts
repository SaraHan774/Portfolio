/**
 * Optimized window resize hook
 *
 * Debounce + RequestAnimationFrame 조합으로 성능 최적화
 * - Debounce: 빠른 연속 호출 방지
 * - RAF: 브라우저 repaint 사이클에 맞춰 실행 (16.6ms/60fps)
 *
 * @param callback - Resize 시 실행할 콜백
 * @param delay - Debounce 딜레이 (ms)
 * @returns cleanup function
 */

import { useEffect, useRef, useCallback } from 'react';

export interface UseOptimizedResizeOptions {
  /** Debounce 딜레이 (기본: 150ms) */
  delay?: number;
  /** Resize 시작 시 즉시 실행 여부 (기본: false) */
  leading?: boolean;
  /** 이벤트 리스너 옵션 */
  listenerOptions?: AddEventListenerOptions;
}

export const useOptimizedResize = (
  callback: () => void,
  options: UseOptimizedResizeOptions = {}
) => {
  const {
    delay = 150,
    leading = false,
    listenerOptions = { passive: true },
  } = options;

  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  // 콜백 참조 업데이트 (최신 클로저 유지)
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cleanup = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const executeCallback = useCallback(() => {
    cleanup();
    frameRef.current = requestAnimationFrame(() => {
      callbackRef.current();
      lastCallRef.current = Date.now();
      frameRef.current = null;
    });
  }, [cleanup]);

  const handleResize = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    // Leading edge: 첫 호출 시 즉시 실행
    if (leading && timeSinceLastCall > delay) {
      executeCallback();
      return;
    }

    // Cleanup 이전 타이머/프레임
    cleanup();

    // Debounce: delay 후 RAF로 실행
    timeoutRef.current = setTimeout(() => {
      executeCallback();
      timeoutRef.current = null;
    }, delay);
  }, [delay, leading, executeCallback, cleanup]);

  useEffect(() => {
    window.addEventListener('resize', handleResize, listenerOptions);

    return () => {
      cleanup();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, cleanup, listenerOptions]);

  // Manual cleanup 함수 반환 (필요 시 외부에서 호출)
  return cleanup;
};

/**
 * Throttled resize hook (일정 주기로 실행)
 *
 * Debounce 대신 Throttle 사용
 * - 최소 간격을 보장하면서 주기적으로 실행
 * - 스크롤바나 실시간 업데이트가 필요한 경우 유용
 */
export const useThrottledResize = (
  callback: () => void,
  interval: number = 100
) => {
  const frameRef = useRef<number | null>(null);
  const lastRunRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleResize = useCallback(() => {
    const now = Date.now();

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      const elapsed = now - lastRunRef.current;

      if (elapsed >= interval) {
        callbackRef.current();
        lastRunRef.current = now;
      }

      frameRef.current = null;
    });
  }, [interval]);

  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);
};
