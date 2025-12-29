// Custom hook for caption link hover event management

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCaptionHoverEventsOptions {
  /** 캡션 컨테이너를 식별하는 선택자 */
  containerSelector: string;
  /** Hover 활성화까지의 지연 시간 (ms) */
  hoverDelay?: number;
  /** Hover 비활성화까지의 지연 시간 (ms) */
  hideDelay?: number;
  /** Safe zone margin (px) */
  safeZoneMargin?: number;
  /** 현재 표시 중인 작업 ID (hover 대상에서 제외) */
  currentWorkId?: string;
  /** DOM이 변경되었음을 알리는 의존성 배열 */
  dependencies?: React.DependencyList;
}

export interface UseCaptionHoverEventsReturn {
  /** 현재 hover 중인 작업 ID */
  hoveredWorkId: string | null;
  /** Hover 위치 좌표 */
  hoverPosition: { x: number; y: number } | null;
  /** Hover 상태 초기화 함수 */
  clearHover: () => void;
}

/**
 * Caption 링크 hover 이벤트를 관리하는 hook
 *
 * Caption 내 작업 링크에 마우스를 올리면 FloatingWorkWindow를 표시하기 위한
 * 이벤트 리스너와 safe zone 로직을 제공합니다.
 *
 * Note: This hook provides caption-specific hover tracking with safe zones.
 * It is distinct from UIStateContext hover state, which is for general work hover tracking.
 *
 * Features:
 * - 링크에 mouseenter/mouseleave 이벤트 자동 부착
 * - MutationObserver로 동적 DOM 변경 감지
 * - Safe zone 로직 (링크 + FloatingWindow + margin)
 * - Configurable timeout (enter delay, hide delay)
 * - 현재 작업 hover 방지
 *
 * @example WorkModal
 * ```tsx
 * const { hoveredWorkId, hoverPosition, clearHover } = useCaptionHoverEvents({
 *   containerSelector: '[data-is-modal="true"]',
 *   hoverDelay: 400,
 *   hideDelay: 200,
 *   currentWorkId: modalWork?.id,
 *   dependencies: [modalWork],
 * });
 * ```
 *
 * @example Work Detail Page
 * ```tsx
 * const { hoveredWorkId, hoverPosition, clearHover } = useCaptionHoverEvents({
 *   containerSelector: '[data-caption-container-id]',
 *   hoverDelay: 400,
 *   hideDelay: 200,
 *   currentWorkId: work?.id,
 *   dependencies: [work],
 * });
 * ```
 *
 * @param options - Hook 설정 옵션
 * @returns Hover 상태 및 제어 함수
 */
export const useCaptionHoverEvents = ({
  containerSelector,
  hoverDelay = 400,
  hideDelay = 200,
  safeZoneMargin = 20,
  currentWorkId,
  dependencies = [],
}: UseCaptionHoverEventsOptions): UseCaptionHoverEventsReturn => {
  // Hover 상태
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Timeout 관리
  const hoverLinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safe zone 추적
  const isInSafeZoneRef = useRef<boolean>(true);

  // Ref for closure access
  const hoveredWorkIdRef = useRef<string | null>(null);
  const hoverPositionRef = useRef<{ x: number; y: number } | null>(null);

  // MutationObserver
  const observerRef = useRef<MutationObserver | null>(null);

  // Hover 상태 초기화
  const clearHover = useCallback(() => {
    setHoveredWorkId(null);
    setHoverPosition(null);
    hoveredWorkIdRef.current = null;
    hoverPositionRef.current = null;
  }, []);

  // hoverPosition/hoveredWorkId 변경 시 ref 업데이트 (safe zone에서 사용)
  useEffect(() => {
    hoverPositionRef.current = hoverPosition;
  }, [hoverPosition]);

  useEffect(() => {
    hoveredWorkIdRef.current = hoveredWorkId;
  }, [hoveredWorkId]);

  // Safe zone 감지 로직
  useEffect(() => {
    if (!hoveredWorkId) {
      isInSafeZoneRef.current = true;
      return;
    }

    const checkSafeZone = (mouseX: number, mouseY: number): boolean => {
      // 링크 영역 체크
      const links = document.querySelectorAll(`a[data-work-id="${hoveredWorkIdRef.current}"]`);
      let linkBottom = 0;
      let linkLeft = Infinity;
      let linkRight = 0;

      for (const link of links) {
        const rect = link.getBoundingClientRect();
        linkBottom = Math.max(linkBottom, rect.bottom);
        linkLeft = Math.min(linkLeft, rect.left);
        linkRight = Math.max(linkRight, rect.right);

        if (
          mouseX >= rect.left - safeZoneMargin &&
          mouseX <= rect.right + safeZoneMargin &&
          mouseY >= rect.top - safeZoneMargin &&
          mouseY <= rect.bottom + safeZoneMargin
        ) {
          return true;
        }
      }

      // FloatingWindow 영역 체크
      const floatingWindow = document.querySelector('[data-floating-window="true"]');
      if (floatingWindow) {
        const rect = floatingWindow.getBoundingClientRect();
        if (
          mouseX >= rect.left - safeZoneMargin &&
          mouseX <= rect.right + safeZoneMargin &&
          mouseY >= rect.top - safeZoneMargin &&
          mouseY <= rect.bottom + safeZoneMargin
        ) {
          return true;
        }

        // 링크와 FloatingWindow 사이 연결 영역 (세로)
        if (
          mouseY >= linkBottom - safeZoneMargin &&
          mouseY <= rect.top + safeZoneMargin &&
          mouseX >= Math.min(linkLeft, rect.left) - safeZoneMargin &&
          mouseX <= Math.max(linkRight, rect.right) + safeZoneMargin
        ) {
          return true;
        }
      } else if (linkBottom > 0) {
        // FloatingWindow 로딩 중일 때 링크 아래 영역 허용
        if (
          mouseY >= linkBottom - safeZoneMargin &&
          mouseY <= linkBottom + 180 &&
          mouseX >= linkLeft - 100 &&
          mouseX <= linkRight + 100
        ) {
          return true;
        }
      }

      return false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const isInSafeZone = checkSafeZone(e.clientX, e.clientY);

      if (isInSafeZone) {
        isInSafeZoneRef.current = true;
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      } else if (isInSafeZoneRef.current) {
        isInSafeZoneRef.current = false;
        if (!hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            clearHover();
            hideTimeoutRef.current = null;
          }, hideDelay);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [hoveredWorkId, hideDelay, safeZoneMargin, clearHover]);

  // 스크롤 시 Floating Window 숨김
  useEffect(() => {
    if (!hoveredWorkId) return;

    const handleScroll = () => {
      clearHover();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hoveredWorkId, clearHover]);

  // 캡션 링크 이벤트 리스너 설정
  useEffect(() => {
    const eventHandlers = new Map<
      HTMLElement,
      {
        enter: (e: Event) => void;
        leave: () => void;
      }
    >();

    const handleLinkMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;
      if (link) {
        const linkWorkId = link.getAttribute('data-work-id');

        // 현재 작업과 동일한 링크는 hover 무시
        if (linkWorkId && linkWorkId !== currentWorkId) {
          if (hoverLinkTimeoutRef.current) {
            clearTimeout(hoverLinkTimeoutRef.current);
            hoverLinkTimeoutRef.current = null;
          }
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }

          hoverLinkTimeoutRef.current = setTimeout(() => {
            const rect = link.getBoundingClientRect();
            // 링크의 왼쪽 상단을 기준점으로 설정 (팝업이 링크 위/왼쪽에 표시됨)
            const x = rect.left;
            const y = rect.top;

            isInSafeZoneRef.current = true;

            setHoverPosition({ x, y });
            setHoveredWorkId(linkWorkId);
            hoverLinkTimeoutRef.current = null;
          }, hoverDelay);
        }
      }
    };

    const handleLinkMouseLeave = () => {
      if (hoverLinkTimeoutRef.current) {
        clearTimeout(hoverLinkTimeoutRef.current);
        hoverLinkTimeoutRef.current = null;
      }
    };

    const attachEventListeners = (container: Element) => {
      const links = container.querySelectorAll('a[data-work-id]');
      links.forEach((link) => {
        const linkElement = link as HTMLElement;

        // 기존 이벤트 리스너 제거
        const existingHandlers = eventHandlers.get(linkElement);
        if (existingHandlers) {
          linkElement.removeEventListener('mouseenter', existingHandlers.enter);
          linkElement.removeEventListener('mouseleave', existingHandlers.leave);
        }

        const handlers = {
          enter: handleLinkMouseEnter,
          leave: handleLinkMouseLeave,
        };
        eventHandlers.set(linkElement, handlers);

        linkElement.addEventListener('mouseenter', handlers.enter);
        linkElement.addEventListener('mouseleave', handlers.leave);
      });
    };

    const setupEventListeners = () => {
      // 기존 이벤트 리스너 모두 제거
      eventHandlers.forEach((handlers, link) => {
        link.removeEventListener('mouseenter', handlers.enter);
        link.removeEventListener('mouseleave', handlers.leave);
      });
      eventHandlers.clear();

      // 초기 컨테이너에 이벤트 리스너 부착
      const captionContainers = document.querySelectorAll(containerSelector);
      captionContainers.forEach(attachEventListeners);

      // MutationObserver로 동적 DOM 변경 감지
      const observer = new MutationObserver(() => {
        const allContainers = document.querySelectorAll(containerSelector);
        allContainers.forEach((container) => {
          const links = container.querySelectorAll('a[data-work-id]');
          links.forEach((link) => {
            const linkElement = link as HTMLElement;
            if (!eventHandlers.has(linkElement)) {
              const handlers = {
                enter: handleLinkMouseEnter,
                leave: handleLinkMouseLeave,
              };
              eventHandlers.set(linkElement, handlers);
              linkElement.addEventListener('mouseenter', handlers.enter);
              linkElement.addEventListener('mouseleave', handlers.leave);
            }
          });
        });
      });

      // document.body를 observe하여 모든 DOM 변경 감지 (모달 포함)
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return observer;
    };

    // 초기 설정 (100ms delay)
    const timeoutId = setTimeout(() => {
      const observer = setupEventListeners();
      observerRef.current = observer;
    }, 100);

    // 추가 재확인 (300ms delay)
    const recheckTimeoutId = setTimeout(() => {
      const captionContainers = document.querySelectorAll(containerSelector);
      captionContainers.forEach(attachEventListeners);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(recheckTimeoutId);

      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      eventHandlers.forEach((handlers, link) => {
        link.removeEventListener('mouseenter', handlers.enter);
        link.removeEventListener('mouseleave', handlers.leave);
      });
      eventHandlers.clear();

      if (hoverLinkTimeoutRef.current) {
        clearTimeout(hoverLinkTimeoutRef.current);
        hoverLinkTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerSelector, hoverDelay, currentWorkId, ...dependencies]);

  return {
    hoveredWorkId,
    hoverPosition,
    clearHover,
  };
};
